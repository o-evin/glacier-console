import fs from 'fs';
import Debug from 'debug';
import Queue from './queue';
import TreeHash from '../api/hasher/tree_hash';

import {dialog} from 'electron';
import {QueueRejectError} from '../../contracts/errors';
import {Transfer as Defaults} from '../../contracts/const';

import {
  RequestType,
  UploadStatus,
  UploaderStatus,
  PartStatus,
} from '../../contracts/enums';

import UploadStore from '../storage/typed/upload_store';

import * as glacier from '../api/glacier';

const debug = new Debug('uploader');

export default class Uploader {

  constructor(queue) {
    this.queue = new Queue();
    this.store = new UploadStore();
    this.status = UploaderStatus.PENDING;
  }

  start() {

    if(this.status === UploaderStatus.PENDING) {

      this.queue.start();
      this.status = UploaderStatus.PROCESSING;

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

          if(error instanceof QueueRejectError) return;

          debug('APP ERROR');

          dialog.showErrorBox('A fatal error',
            `Unable to start a receiver queue. Please restart the application.
            ${error.toString()}`
          );

          debug('ERROR (%O)', error);
        });
    }

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

    return this.store.getParts()
      .then((parts) => {

        debug('ACTUALIZE %s parts', parts.length);

        return Promise.all(
          parts.filter(
            item => uploads.some(
              upload => upload.id === item.parentId
            ) === false
          ).map(part => this.store.removePart(part.id))
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
        return this.queue.push(
          parts.map(
            part => this.uploadPart.bind(this, part)
          ),
          RequestType.UPLOAD_PART,
          upload.id
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
        return this.queue.push(
          this.finalizeUpload.bind(this, upload),
          RequestType.GENERAL,
          upload.id
        );
      })
      .catch((error) => {

        if(error instanceof QueueRejectError) return;

        debug('UPLOAD ERROR', upload.description, error);

        dialog.showErrorBox('Upload error',
          `There was an error with ${upload.description} operation:
          ${error.toString()}`
        );

        upload.setError(error);
        return this.store.update(upload);
      });
  }

  uploadPart(part, attempt = 0) {

    if(part.status === PartStatus.DONE) {
      return Promise.resolve(part);
    }

    debug('UPLOADING PART (id: %s)', part.id);

    return this.store.get(part.parentId)
      .then((upload) => {

        if(!upload) throw new Error('Upload is incorrect.');

        let buffer = Buffer.alloc(part.size);
        const fd = fs.openSync(upload.filePath, 'r');

        fs.readSync(fd, buffer, 0, part.size, part.position);

        return glacier.uploadPart(part, upload.vaultName, buffer)
          .then(({checksum}) => {

            debug('PART DONE (id: %s)', part.id);

            part.checksum = checksum;
            part.status = PartStatus.DONE;

            buffer = null;

            return this.store.updatePart(part);
          })
          .catch((error) => {

            debug('PART ERROR (id: %s): %O', part.id, error);

            if(attempt < Defaults.UPLOAD_RETRY_ATTEMPTS) {

              debug('RETRY', attempt, part.id);

              return this.uploadPart(part, ++attempt);
            }

            throw error;
          });
      });

  }

  finalizeUpload(upload, attempt = 0) {

    debug('FINALIZE', upload.description);

    return this.store.get(upload.id)
      .then((upload) => {

        if(!upload) return;

        return glacier.completeUpload(upload)
          .then((upload) => {

            debug('FINALIZED', upload.description);

            upload.status = UploadStatus.DONE;
            return this.store.update(upload);
          })
          .catch((error) => {

            debug('FINALIZE ERROR', upload.description, error);

            if(attempt < Defaults.UPLOAD_RETRY_ATTEMPTS) {

              debug('FINALIZE RETRY', upload.description, attempt + 1);

              return this.finalizeUpload(upload, ++attempt);
            }

            throw error;
          });

      });
  }

  push(upload) {

    const parts = upload.parts;

    debug('NEW UPLOAD %s (parts: %s)', upload.description, parts.length);

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

  inventoryUpdate(inventory) {
    return this.store.find({vaultName: inventory.vaultName})
      .then((uploads) => {

        debug(
          'INVENTORY UPDATE (%s, date: %s)',
          inventory.id, inventory.createdAt
        );

        const archives = inventory.archives || [];

        return Promise.all(
          uploads.filter(upload =>
            upload.completedAt < inventory.createdAt ||
            archives.some(item => item.id === upload.archiveId)
          ).map(item => this.store.remove(item))
        );
      });
  }

  restartUpload(upload) {

    return this.store.get(upload.id)
      .then((upload) => {

        if(upload.status !== UploadStatus.ERROR) {
          return upload;
        }

        debug('RESTART UPLOAD', upload.description);

        upload.status = UploadStatus.PROCESSING;
        return this.store.update(upload);
      })
      .then((upload) => {
        return this.queue.remove(upload.id)
          .then(() => upload);
      })
      .then((upload) => {
        this.queueUpload(upload);
        return upload;
      });
  }

  removeUpload(upload) {

    debug('DELETE UPLOAD', upload.description);

    upload.status = UploadStatus.HOLD;

    return this.store.update(upload)
      .then((upload) => {
        return this.queue.remove(upload.id);
      })
      .then(() => {
        return this.store.get(upload.id);
      })
      .then((upload) => {
        return upload.archiveId ?
          glacier.deleteArchive(upload.archiveId, upload.vaultName) :
          glacier.abortUpload(upload);
      })
      .then(() => {
        return this.store.remove(upload);
      });
  }

  stop() {
    debug('STOPPING (status: %s)', this.status);

    this.status = UploaderStatus.PENDING;

    return this.queue.stop()
      .then(() => {
        return this.store.close();
      })
      .then(() => {
        debug('STOPPED', this.status);
      });
  }

  isProcessing() {
    return this.queue.isProcessing();
  }

  subscribe(listener) {
    return this.store.subscribe(listener);
  }

}
