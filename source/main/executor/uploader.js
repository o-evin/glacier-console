import fs from 'fs';
import Debug from 'debug';
import Queue from './queue';
import TreeHash from '../api/hasher/tree_hash';

import {dialog} from 'electron';

import {glacier} from '../api';

import {
  PartStatus,
  RequestType,
  QueueStatus,
  UploadStatus,
} from '../../contracts/enums';

import UploadStore from '../storage/typed/upload_store';

const debug = new Debug('executor:uploader');

export default class Uploader {

  constructor(queue) {
    this.queue = new Queue();
    this.store = new UploadStore();
    this.status = QueueStatus.PENDING;
  }

  start() {

    if(this.status === QueueStatus.PENDING) {

      this.queue.start();
      this.status = QueueStatus.PROCESSING;

      debug('STARTING');

      return this.store.list()
        .then((uploads) => {

          if(!uploads.length) return uploads;

          debug('FOUND %s uploads', uploads.length);

          const interrupted = uploads.filter(
            item => item.status === UploadStatus.HOLD
          );

          if(interrupted.length === 0) return uploads;

          debug('INTERRUPTED %s uploads', interrupted.length);

          return Promise.all(
            interrupted.map(item => item.setError('Operation aborted.'))
              .map(item => this.store.update(item))
          ).then((updates) => {
            return uploads.filter(
              item => updates.some(update => update.id === item.id) === false
            ).concat(updates);
          });
        })
        .then((uploads) => {
          return this.actualizeUploads(uploads);
        })
        .then((uploads) => {
          return this.actualizeParts(uploads)
            .then(() => {
              return uploads.filter(
                item => item.status === UploadStatus.PROCESSING
              );
            });
        })
        .then((uploads) => {

          debug('ACTIVE %s uploads', uploads.length);

          uploads.forEach(
            item => this.queueUpload(item)
          );

          debug('INIT DONE');
        })
        .catch((error) => {

          debug('APP ERROR');

          dialog.showErrorBox('A fatal error',
            `Unable to start a receiver queue. Please restart the application.
            ${error.toString()}`
          );

          debug('ERROR (%O)', error);
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

    const parts = upload.getParts();

    debug('PUSH UPLOAD %s (parts: %s)', upload.description, parts.length);

    return Promise.all(parts.map(
      item => this.store.createPart(item)
    ))
      .then(() => {
        return this.store.create(upload);
      })
      .then((upload) => {
        this.queueUpload(upload);
        return upload;
      });

  }

  restart(upload) {
    debug('RESTART UPLOAD %s (status: %s)', upload.description, upload.status);

    return this.queue.remove(upload)
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

    upload.status = UploadStatus.HOLD;

    return this.store.update(upload)
      .then((upload) => {
        return this.queue.remove(upload);
      })
      .then(() => {
        return this.store.remove(upload);
      });
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

    debug('ACTUALIZE %s uploads', uploads.length);

    return this.queue.push(glacier.listVaults)
      .then((vaults) => {

        debug('GLACIER VAULTS %s', vaults.length);

        return this.queue.push(
          vaults.map(
            vault => glacier.listUploads.bind(null, vault)
          )
        ).then((results) => {
          const jobs = [].concat(...results);

          debug('GLACIER UPLOADS %s', jobs.length);

          return Promise.all(
            uploads.filter(
              item => item.status !== UploadStatus.DONE
            ).filter(
              item => jobs.some(job => job.id === item.id) === false
            ).map(
              item => this.store.remove(item)
            )
          );
        }).then((deleted) => {

          debug('EXPIRED %s uploads', deleted.length);

          return uploads.filter(
            item => deleted.includes(item.id) === false
          );

        });
      });
  }

  actualizeParts(uploads) {

    return this.store.listParts()
      .then((parts) => {

        debug('ACTUALIZE %s parts', parts.length);

        return Promise.all(
          parts.filter(
            item => uploads.some(
              upload => upload.id === item.parentId
            ) === false
          ).map(part => this.store.removePart(part))
        )
          .then((deleted) => {

            debug('REMOVED %s corrupted parts', deleted.length);

            return parts.filter(
              item => deleted.includes(item.id) === false
            );
          });

      });

  }

  queueUpload(upload) {

    debug('QUEUE upload', upload.description);

    return this.store.findParts({parentId: upload.id})
      .then((parts) => {
        return Promise.all(
          parts.map(this.uploadPart.bind(this))
        );
      }).then((parts) => {

        debug('UPLOAD DONE (%s parts)', parts.length);

        const checksum = TreeHash.from(
          parts.sort((a, b) => a.position - b.position)
            .map(item => item.checksum)
        );

        upload.checksum = checksum;
        return this.store.update(upload);

      }).then((upload) => {
        return this.finalizeUpload(upload);
      })
      .catch((error) => {

        debug('ERROR (upload: %s) %O', upload.description, error);

        dialog.showErrorBox('Upload error',
          `There was an error with ${upload.description} operation:
          ${error.toString()}`
        );

        upload.setError(error);
        return this.store.update(upload);
      });
  }

  uploadPart(part) {

    if(part.status === PartStatus.DONE) {
      return Promise.resolve(part);
    }

    debug('UPLOADING PART (id: %s)', part.id);

    return this.store.get(part.parentId)
      .then((upload) => {

        let buffer = Buffer.alloc(part.size);
        const fd = fs.openSync(upload.filePath, 'r');

        fs.readSync(fd, buffer, 0, part.size, part.position);

        return this.queue.push(
          glacier.uploadPart.bind(null, part, upload.vaultName, buffer), {
            type: RequestType.UPLOAD_PART, reference: upload.id,
          })
          .then(({checksum}) => {

            debug('PART DONE (id: %s)', part.id);

            part.checksum = checksum;
            part.status = PartStatus.DONE;

            buffer = null;

            return this.store.updatePart(part);
          });
      });

  }

  finalizeUpload(upload) {

    debug('FINALIZE', upload.description);

    return this.queue.push(
      glacier.completeUpload.bind(null, upload),
      {reference: upload.id}
    )
      .then((upload) => {

        debug('FINALIZED', upload.description);

        upload.status = UploadStatus.DONE;
        return this.store.update(upload);
      });

  }

}
