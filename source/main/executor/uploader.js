import Queue from './queue';
import TreeHash from '../api/hasher/tree_hash';

import {dialog} from 'electron';

import {glacier} from '../api';

import {
  RequestType,
  QueueStatus,
  UploadStatus,
} from '../../contracts/enums';

import {HandledRejectionError} from '../../contracts/errors';

import UploadStore from '../storage/typed/upload_store';

import logger from '../../utils/logger';
const debug = logger('executor:uploader');
const errlog = logger('executor:uploader', 'error');

export default class Uploader {

  constructor(queue) {
    this.deferred = [];
    this.queue = new Queue();
    this.store = new UploadStore();
    this.status = QueueStatus.PENDING;
  }

  start() {

    if(this.status === QueueStatus.PENDING) {

      debug('STARTING');
      this.queue.start();
      this.status = QueueStatus.PROCESSING;

      return this.store.list()
        .then((uploads) => {
          if(!uploads.length) return uploads;
          debug('FOUND %s uploads', uploads.length);
          return this.actualizeUploads(uploads);
        })
        .then(() => {
          debug('INIT DONE');
        })
        .catch((error) => {

          if(error instanceof HandledRejectionError) return;

          errlog('ERROR', error);

          dialog.showErrorBox('A fatal error',
            `Unable to start a receiver queue. Please restart the application.
            ${error.toString()}`
          );

        });
    }

  }

  stop() {
    debug('STOPPING (status: %s)', this.status);

    this.status = QueueStatus.PENDING;

    return this.queue.stop()
      .then(() => {
        return this.store.close();
      })
      .then(() => {
        debug('STOPPED');
      });
  }

  push(upload) {

    debug('PUSH UPLOAD %s', upload.description);

    return this.store.create(upload)
      .then((upload) => {
        this.queueUpload(upload);
        return upload;
      });

  }

  restart(upload) {
    debug('RESTART UPLOAD %s (status: %s)', upload.description, upload.status);

    return this.stopUpload(upload)
      .then(() => {
        upload.status = UploadStatus.PROCESSING;
        return this.store.update(upload);
      })
      .then((upload) => {
        this.queueUpload(upload);
        return upload;
      });
  }

  remove(upload) {
    debug('DELETE UPLOAD', upload.description);

    return this.stopUpload(upload)
      .then(() => {
        return this.store.remove(upload);
      });
  }

  removeAll(criterion) {
    return this.store.find(criterion)
      .then((uploads) => {
        return uploads.map(item => this.remove(item));
      });
  }

  stopUpload(upload) {

    this.deferred = this.deferred.filter(
      item => item.id !== upload.id
    );

    debug('STOP UPLOAD (%s)', upload.description);
    return this.queue.remove(upload)
      .then(() => upload);
  }

  isProcessing() {
    return this.queue.isProcessing();
  }

  subscribe(listener) {
    debug('SUBSCRIBE to store');
    return this.store.subscribe(listener);
  }

  syncInventory(inventory) {
    return this.store.find({vaultName: inventory.vaultName})
      .then((uploads) => {

        debug('INVENTORY UPDATE (%s, date: %s)',
          inventory.id, inventory.createdAt
        );

        const {archives, createdAt} = inventory;

        return Promise.all(
          uploads.filter(upload =>
            upload.completedAt < createdAt ||
            archives.some(item => item.id === upload.archiveId)
          ).map(item => this.store.remove(item))
        );
      });
  }

  actualizeUploads(uploads) {

    uploads = uploads.filter(
      item => item.status !== UploadStatus.DONE
    );

    debug('ACTUALIZE %s uploads', uploads.length);

    return uploads.reduce((p, upload) => {
      return p.then(() => {
        return this.queue.push(
          glacier.getUpload.bind(null, upload)
        );
      })
        .then((job) => {
          if(job) {
            debug('RESTARTING', upload.description);
            return this.store.get(job.id)
              .then((upload) => {
                if(upload && upload.status === UploadStatus.PROCESSING) {
                  this.queueUpload(upload);
                }
              });
          } else {
            //TODO: verify strange behaviour when set expired for active
            debug('EXPIRED', upload.description);
            upload.setError('Expired');
            return this.store.update(upload);
          }
        });
    }, Promise.resolve());

  }

  queueUpload(upload) {

    if(this.queue.getSlots(RequestType.UPLOAD_PART) <= 0) {
      debug('DEFER upload', upload.description);
      this.deferred.push(upload);
      return upload;
    }

    debug('QUEUE upload', upload.description);

    return this.uploadMultipart(upload)
      .then(() => {

        debug('UPLOAD DONE', upload.description);

        //TODO: Make async?
        upload.checksum = TreeHash.from(upload.filePath);
        return this.store.update(upload);

      }).then((upload) => {
        return this.finalizeUpload(upload);
      })
      .catch((error) => {

        if(error instanceof HandledRejectionError) return;

        errlog('ERROR (upload: %s)', upload.description, error);

        this.stopUpload(upload);
        upload.setError(error);

        return this.store.update(upload);
      })
      .then(() => {
        if(this.deferred.length > 0) {
          this.queueUpload(this.deferred.shift());
        }
      });
  }

  uploadMultipart(upload) {
    debug('UPLOAD MULTIPART', upload.description, upload.position);

    const slots = this.queue.getSlots(RequestType.UPLOAD_PART);
    const parts = upload.getPendingParts(Math.max(slots, 1));
    debug('QUEUE %s parts for', parts.length, upload.description);

    return Promise.all(
      parts.map(part =>
        this.uploadPart(upload, part)
          .then((part) => {
            debug('ADD SEQUENCE %s for', part.position, upload.description);
            upload.addSequence(part.position);
            return this.store.update(upload);
          })
      )
    )
      .then(() => {
        if(upload.position < upload.archiveSize) {
          return this.uploadMultipart(upload);
        }
      });
  }

  uploadPart(upload, part) {

    debug('UPLOAD RANGE', upload.description, part.range);

    return this.queue.push(glacier.uploadPart, {
      type: RequestType.UPLOAD_PART,
      reference: upload.id,
      params: [{part, upload}],
    })
      .then(({checksum}) => {
        debug('RANGE DONE', upload.description, part.range);
        part.checksum = checksum;
        return part;
      });
  }

  finalizeUpload(upload) {

    debug('FINALIZE', upload.description);

    return this.queue.push(glacier.completeUpload, {
      reference: upload.id,
      params: [upload],
    })
      .then((upload) => {
        debug('FINALIZED', upload.description);

        upload.status = UploadStatus.DONE;
        return this.store.update(upload);
      });

  }

}
