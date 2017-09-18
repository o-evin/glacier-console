import fs from 'fs';
import path from 'path';
import Debug from 'debug';
import Queue from './queue';
import TreeHash from '../api/hasher/tree_hash';

import {dialog} from 'electron';

import {glacier} from '../api';
import {Transfer} from '../../contracts/const';

import {
  PartStatus,
  RequestType,
  RetrievalAction,
  RetrievalStatus,
  QueueStatus,
} from '../../contracts/enums';

import RetrievalStore from '../storage/typed/retrieval_store';

const debug = new Debug('executor:receiver');

export default class Receiver {

  constructor(queue) {
    this.queue = new Queue();
    this.store = new RetrievalStore();
    this.status = QueueStatus.PENDING;
  }

  start() {
    if(this.status === QueueStatus.PENDING) {

      this.queue.start();

      debug('STARTING');

      return this.store.list()
        .then((retrievals) => {

          if(!retrievals.length) return retrievals;

          debug('FOUND %s retrievals', retrievals.length);

          const interrupted = retrievals.filter(
            item => item.status === RetrievalStatus.HOLD
          );

          if(interrupted.length === 0) return retrievals;

          debug('INTERRUPTED %s retrievals', interrupted.length);

          return Promise.all(
            interrupted.map(item => item.setError('Operation aborted.'))
              .map(item => this.store.update(item))
          ).then((updates) => {
            return retrievals.filter(
              item => updates.some(update => update.id === item.id) === false
            ).concat(updates);
          });

        })
        .then((retrievals) => {

          if(!retrievals.length) return retrievals;

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
          return this.actualizeRetrievals(retrievals);
        })
        .then((retrievals) => {
          return this.actualizeParts(retrievals)
            .then(() => {
              return retrievals.filter(
                item => item.status === RetrievalStatus.PROCESSING
              );
            });
        })
        .then((retrievals) => {

          debug('ACTIVE %s retrievals', retrievals.length);

          retrievals.forEach(this.queueRetrieval.bind(this));
          this.initPendingHandler();

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

  push(retrieval) {

    const parts = retrieval.getParts();

    debug('PUSH RETRIEVAL %s (%s parts)', retrieval.description, parts.length);

    return Promise.all(parts.map(
      item => this.store.createPart(item)
    ))
      .then(() => {
        return this.store.create(retrieval);
      })
      .then((retrieval) => {
        this.initPendingHandler();
        return retrieval;
      });

  }

  remove(retrieval) {

    debug('DELETE RETRIEVAL', retrieval.description);

    retrieval.status = RetrievalStatus.HOLD;

    return this.store.update(retrieval)
      .then((retrieval) => {
        return this.queue.remove(retrieval);
      })
      .then(() => {
        return this.store.remove(retrieval);
      });
  }

  restart(retrieval) {
    debug('RESTART RETRIEVAL (%s)', retrieval.description);

    return this.queue.remove(retrieval)
      .then((retrieval) => {
        retrieval.status = RetrievalStatus.PENDING;
        return this.store.update(retrieval);
      })
      .then((retrieval) => {
        this.initPendingHandler();
        return retrieval;
      });
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

    return this.queue.push(glacier.listVaults)
      .then((vaults) => {

        debug('GLACIER VAULTS', vaults.length);

        return this.queue.push(
          vaults.map(
            vault => glacier.listRetrievals.bind(null, vault)
          )
        )
          .then((results) => {
            const jobs = [].concat(...results);

            debug('GLACIER JOBS', jobs.length);

            return Promise.all(
              retrievals.filter(
                item => jobs.some(job => job.id === item.id) === false
              ).map(
                item => this.store.remove(item)
              )
            );
          }).then((deleted) => {

            debug('EXPIRED %s retrievals', deleted.length);

            return retrievals.filter(
              item => deleted.includes(item.id) === false
            );

          });
      });
  }

  actualizeParts(retrievals) {

    return this.store.listParts()
      .then((parts) => {

        debug('ACTUALIZE %s parts', parts.length);

        return Promise.all(
          parts.filter(
            item => retrievals.some(
              retrieval => retrieval.id === item.parentId
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

  queueRetrieval(retrieval) {

    debug('QUEUE retrieval (id: %s)', retrieval.description);

    const dirname = path.dirname(retrieval.filePath);

    if(!fs.existsSync(dirname)){
      fs.mkdirSync(dirname);
    }

    try {
      var stats = fs.statSync(retrieval.filePath);
    } catch(error) {
      stats = null;
    }

    if(!stats || stats.size !== retrieval.archiveSize) {
      const fd = fs.openSync(retrieval.filePath, 'w');
      fs.writeSync(fd, Buffer.alloc(retrieval.archiveSize));
    }

    return this.store.findParts({parentId: retrieval.id})
      .then((parts) => {
        return Promise.all(
          parts.map(this.downloadPart.bind(this))
        );
      })
      .then((parts) => {

        debug('DOWNLOAD DONE (%s parts)', parts.length);

        const checksum = TreeHash.from(
          parts.sort((a, b) => a.position - b.position)
            .map(item => item.checksum)
        );

        if(retrieval.checksum !== checksum) {

          debug('CHECKSUM MISMATCH (%s)', retrieval.description);

          throw new Error('Checksum mismatch.');
        }

        debug('RETRIEVAL DONE (%s)', retrieval.description);

        retrieval.status = RetrievalStatus.DONE;
        return this.store.update(retrieval);
      })
      .catch((error) => {

        debug('ERROR (retrieval: %s): %O', retrieval.description);

        dialog.showErrorBox('Download error',
          `There was an error with ${retrieval.description} operation:
          ${error.toString()}`
        );

        retrieval.setError(error);
        return this.store.update(retrieval);
      });
  }

  downloadPart(part) {

    if(part.status === PartStatus.DONE) {
      return Promise.resolve(part);
    }

    debug('DOWNLOAD PART (id: %s)', part.id);

    return this.store.get(part.parentId)
      .then((retrieval) => {

        return this.queue.push(
          glacier.getRetrievalOutput.bind(null, {retrieval, part}), {
            type: RequestType.DOWNLOAD_PART, reference: part.parentId,
          }
        )
          .then((data) => {

            const checksum = TreeHash.from(data.body);

            if(!data || checksum !== data.checksum) {
              throw new Error('Checksum mismatch.');
            }

            const fd = fs.openSync(retrieval.filePath, 'r+');
            fs.writeSync(fd, data.body, 0, part.size, part.position);

            debug('PART DONE (id: %s)', part.id);

            part.checksum = checksum;
            part.status = PartStatus.DONE;

            return this.store.updatePart(part);
          });
      });
  }

  initPendingHandler() {
    if(this.status === QueueStatus.PENDING) {

      this.status = QueueStatus.PROCESSING;

      const handler = () => {

        return this.store.find({status: RetrievalStatus.PENDING})
          .then((retrievals) => {

            debug('REQUESTING %s retrievals', retrievals.length);

            return Promise.all(
              retrievals.map(this.requestRetrievalStatus.bind(this))
            );

          })
          .then((retrievals) => {
            const processing = retrievals.filter(
              item => item.status === RetrievalStatus.PROCESSING
            );

            const pending = retrievals.filter(
              item => item.status === RetrievalStatus.PENDING
            );

            if(processing.length > 0) {
              debug('QUEUE %s retrievals', retrievals.length);

              return Promise.all(
                processing.map(this.queueRetrieval.bind(this))
              ).then(() => pending);
            }

            return pending;

          })
          .then((retrievals) => {
            debug('PENDING %s retrievals', retrievals.length);

            if(this.status === QueueStatus.PROCESSING && retrievals.length) {
              setTimeout(
                handler.bind(this),
                Transfer.STATUS_INTERVAL
              );
            } else {
              this.status = QueueStatus.PENDING;
            }
          });
      };

      handler();
    }
  }

  requestRetrievalStatus(retrieval) {

    return this.queue.push(
      glacier.describeRetrieval.bind(null, retrieval),
      RequestType.GENERAL,
      retrieval.id
    )
      .then((response) => {

        debug(
          'STATUS %s (status: %s)',
          retrieval.description, response.status
        );

        if(retrieval.status !== response.status) {
          return this.store.update(response);
        }

        return retrieval;
      })
      .catch((error) => {

        debug('RETRIEVAL ERROR (%s): %O',
          retrieval.description, error
        );

        dialog.showErrorBox('Request error',
          `There was an error with ${retrieval.description} operation:
          ${error.toString()}`
        );

        retrieval.setError(error);
        return this.store.update(retrieval);

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
          deleted.map(this.removeRetrieval.bind(this))
        );
      });

  }

}
