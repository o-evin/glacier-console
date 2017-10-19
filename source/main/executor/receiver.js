import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import {dialog} from 'electron';

import Queue from './queue';
import Waiter from './waiter';
import TreeHash from '../api/hasher/tree_hash';
import RetrievalStore from '../storage/typed/retrieval_store';

import {glacier} from '../api';

import {
  RequestType,
  RetrievalAction,
  RetrievalStatus,
  QueueStatus,
} from '../../contracts/enums';

import {HandledRejectionError} from '../../contracts/errors';

import logger from '../../utils/logger';
const debug = logger('executor:receiver');
const errlog = logger('executor:receiver', 'error');

export default class Receiver {

  constructor(queue) {
    this.deferred = [];
    this.queue = new Queue();
    this.waiter = new Waiter();
    this.store = new RetrievalStore();
    this.status = QueueStatus.PENDING;
  }

  start() {
    if(this.status === QueueStatus.PENDING) {

      debug('STARTING');

      this.queue.start();
      this.waiter.start();

      this.status = QueueStatus.PROCESSING;

      return this.store.list()
        .then((retrievals) => {

          if(!retrievals.length) return retrievals;

          debug('FOUND %s retrievals', retrievals.length);

          return Promise.all(
            retrievals.filter(
              item => item.status === RetrievalStatus.DONE
            ).map(
              item => this.store.remove(item)
            )
          )
            .then((deleted) => {

              debug('CLEANUP %s finished retrievals', deleted.length);

              return retrievals.filter(
                item => item.status !== RetrievalStatus.DONE
              );
            });
        })
        .then((retrievals) => {
          const actual = retrievals.filter(
            item => item.status !== RetrievalStatus.ERROR
          );

          if(actual.length === 0) return actual;
          return this.actualizeRetrievals(actual);
        })
        .then((retrievals) => {
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

    return Promise.all([
      this.queue.stop(),
      this.waiter.stop(),
    ])
      .then(() => {
        return this.store.close();
      })
      .then(() => {
        debug('STOPPED');
      });
  }

  push(retrieval) {

    debug('PUSH RETRIEVAL %s', retrieval.description);

    return this.store.create(retrieval)
      .then((retrieval) => {
        this.processRetrieval(retrieval);
        return retrieval;
      });

  }

  restart(retrieval) {
    debug('RESTART RETRIEVAL (%s)', retrieval.description);

    return this.stopRetrieval(retrieval)
      .then(() => {
        retrieval.status = RetrievalStatus.PENDING;
        return this.store.update(retrieval);
      })
      .then((retrieval) => {
        this.processRetrieval(retrieval);
        return retrieval;
      });
  }

  remove(retrieval) {
    debug('DELETE RETRIEVAL', retrieval.description);
    return this.stopRetrieval(retrieval)
      .then(() => {
        return this.store.remove(retrieval);
      });
  }

  removeAll(criterion) {
    return this.store.find(criterion)
      .then((retrievals) => {
        return retrievals.map(item => this.remove(item));
      });
  }

  stopRetrieval(retrieval) {
    debug('STOP RETRIEVAL (%s)', retrieval.description);

    this.deferred = this.deferred.filter(
      item => item.id !== retrieval.id
    );

    return Promise.all([
      this.queue.remove(retrieval),
      this.waiter.remove(retrieval),
    ]).then(() => retrieval);
  }

  subscribe(listener) {
    debug('SUBSCRIBE to store');
    return this.store.subscribe(listener);
  }

  isProcessing() {
    return this.queue.isProcessing();
  }

  actualizeRetrievals(retrievals) {

    debug('ACTUALIZE %s retrievals', retrievals.length);

    return retrievals.reduce((p, retrieval) => {
      return p.then(() => {
        return this.queue.push(
          glacier.describeRetrieval.bind(null, retrieval)
        ).catch((error) => {
          if(error.code === 'ResourceNotFoundException') {
            return null;
          }
          throw error;
        });
      })
        .then((job) => {
          if(job) {
            debug('RESTARTING', retrieval.description);
            return this.store.get(job.id)
              .then((retrieval) => {
                if(retrieval) {
                  if(retrieval.status === RetrievalStatus.PROCESSING) {
                    this.download(retrieval);
                  } else if(retrieval.status === RetrievalStatus.PENDING) {
                    this.processRetrieval(retrieval);
                  }
                }
              });
          } else {
            debug('EXPIRED', retrieval.description);
            return this.store.remove(retrieval);
          }
        });
    }, Promise.resolve());

  }


  processRetrieval(retrieval) {
    return this.waiter.push(
      glacier.describeRetrieval.bind(null, retrieval),
      {status: RetrievalStatus.PROCESSING},
      {reference: retrieval.id},
    )
      .then(() => {
        retrieval.status = RetrievalStatus.PROCESSING;
        return this.store.update(retrieval);
      })
      .then((retrieval) => {
        this.download(retrieval);
      })
      .catch((error) => {
        if(error instanceof HandledRejectionError) return;

        errlog('ERROR (retrieval: %s)', retrieval.description, error);

        retrieval.setError(error);
        return this.store.update(retrieval);
      });
  }

  download(retrieval) {

    const slots = this.queue.getSlots(RequestType.UPLOAD_PART);

    if(slots <= 0) {
      debug('DEFER retrieval', retrieval.description);
      this.deferred.push(retrieval);
      return retrieval;
    }

    debug('QUEUE retrieval', retrieval.description);

    const {filePath, archiveSize} = retrieval;

    const dirname = path.dirname(filePath);

    if(!fs.existsSync(dirname)) {
      mkdirp.sync(dirname);
    }

    try {
      var stats = fs.statSync(filePath);
    } catch(error) {
      stats = null;
    }

    if(!stats || stats.size !== archiveSize) {
      fs.closeSync(fs.openSync(filePath, 'w'));
    }

    return this.downloadMultipart(retrieval)
      .then(() => {

        //TODO: Make async?
        const checksum = TreeHash.from(retrieval.filePath);

        if(retrieval.checksum !== checksum) {
          debug('CHECKSUM MISMATCH (%s)', retrieval.description);
          throw new Error('Checksum mismatch.');
        }

        debug('RETRIEVAL DONE', retrieval.description);

        retrieval.status = RetrievalStatus.DONE;
        return this.store.update(retrieval);
      })
      .catch((error) => {

        if(error instanceof HandledRejectionError) return;

        errlog('ERROR (retrieval: %s)', retrieval.description, error);

        return this.stopRetrieval(retrieval)
          .then(() => {
            retrieval.setError(error);
            return this.store.update(retrieval);
          });
      })
      .then(() => {
        if(this.deferred.length > 0) {
          this.download(this.deferred.shift());
        }
      });
  }

  downloadMultipart(retrieval) {
    debug('DOWNLOAD MULTIPART', retrieval.description, retrieval.position);

    const slots = this.queue.getSlots(RequestType.UPLOAD_PART);
    const parts = retrieval.getPendingParts(Math.max(slots, 1));
    debug('QUEUE %s parts for', parts.length, retrieval.description);

    return Promise.all(
      parts.map(part =>
        this.downloadPart(retrieval, part)
          .then((part) => {
            debug('ADD SEQUENCE %s for', part.position, retrieval.description);
            retrieval.addSequence(part.position);
            return this.store.update(retrieval);
          })
      )
    )
      .then(() => {
        if(retrieval.position < retrieval.archiveSize) {
          return this.downloadMultipart(retrieval);
        }
      });
  }

  downloadPart(retrieval, part) {

    debug('DOWNLOAD RANGE', retrieval.description, part.range);

    return this.queue.push(glacier.getRetrievalOutput, {
      type: RequestType.DOWNLOAD_PART,
      reference: retrieval.id,
      params: [{retrieval, part}],
    })
      .then((data) => {

        part.checksum = TreeHash.from(data.body);

        if(part.checksum !== data.checksum) {
          throw new Error('Checksum mismatch.');
        }

        const fd = fs.openSync(retrieval.filePath, 'r+');
        fs.writeSync(fd, data.body, 0, part.size, part.position);

        data.body = null;
        fs.closeSync(fd);

        debug('RANGE DONE', retrieval.description, part.range);

        return part;
      });
  }

  syncInventory(inventory) {

    debug('ACTUALIZE RETRIEVALS %s', inventory.vaultName);

    const {archives} = inventory;

    return this.store.find({vaultName: inventory.vaultName})
      .then((retrievals) => {

        const deleted = retrievals
          .filter(item => item.action === RetrievalAction.ARCHIVE)
          .filter(
            item => archives.some(
              archive => item.archiveId === archive.id
            ) === false
          );

        return Promise.all(
          deleted.map(item => this.store.remove(item))
        );
      });

  }

}
