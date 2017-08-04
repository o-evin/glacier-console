import fs from 'fs';
import path from 'path';
import Debug from 'debug';
import Queue from './queue';
import TreeHash from '../api/hasher/tree_hash';

import {dialog} from 'electron';
import {QueueRejectError} from '../../contracts/errors';
import {Transfer as Defaults} from '../../contracts/const';

import {
  PartStatus,
  RequestType,
  RetrievalAction,
  ReceiverStatus,
  RetrievalStatus,
} from '../../contracts/enums';

import RetrievalStore from '../storage/typed/retrieval_store';
import InventoryStore from '../storage/typed/inventory_store';

import * as glacier from '../api/glacier';

const debug = new Debug('receiver');

export default class Receiver {

  constructor(queue) {
    this.queue = new Queue();
    this.store = new RetrievalStore();
    this.inventory = new InventoryStore();
    this.status = ReceiverStatus.PENDING;
    this.updaterStatus = ReceiverStatus.PENDING;
  }

  start() {
    if(this.status === ReceiverStatus.PENDING) {

      this.queue.start();
      this.status = ReceiverStatus.PROCESSING;

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

          retrievals.forEach(
            item => item.action === RetrievalAction.ARCHIVE ?
              this.queueRetrieval(item) : this.updateInventory(item)
          );

          this.startStatusUpdater();

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
          /*
          .then((results) => {
            const jobs = [].concat(...results);

            return Promise.all(
              jobs
                .filter(item =>
                  item.action === RetrievalAction.INVENTORY &&
                  item.status === RetrievalStatus.PROCESSING
                )
                .map(item => this.store.create(item))
            )
              .then(console.log)
              .then(() => results);

          })
          */
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

            const actual = retrievals.filter(
              item => deleted.includes(item.id) === false
            );

            return this.actualizeInventories(vaults)
              .then(() => actual);

          });
      });
  }

  actualizeInventories(vaults) {

    return this.inventory.list()
      .then((inventories) => {

        debug('ACTUALIZING UPLOADS with %s inventories', inventories.length);

        const {uploader} = global.queuer;

        return Promise.all(inventories.map(
          inventory => uploader.inventoryUpdate(inventory)
        ))
          .then(() => {

            debug('VERIFYING %s inventories', inventories.length);

            return Promise.all(
              inventories.filter(
                vault => vaults.some(item => item.id === vault.id) === false
              ).map(vault => this.inventory.remove(vault))
            );

          })
          .then((deleted) => {

            debug('REMOVED %s outdated inventories', deleted.length);

            const handlers = vaults
              .filter(
                vault => !!vault.lastInventoryDate
              )
              .filter(vault =>
                inventories.some(inventory =>
                  inventory.vaultName === vault.name &&
                  inventory.createdAt >= vault.lastInventoryDate
                ) === false
              )
              .map(vault => this.requestInventory(vault));

            debug('REFRESH %s inventories', handlers.length);

            return Promise.all(handlers);
          });
      });
  }

  actualizeParts(retrievals) {

    return this.store.getParts()
      .then((parts) => {

        debug('ACTUALIZE %s parts', parts.length);

        return Promise.all(
          parts.filter(
            item => retrievals.some(
              retrieval => retrieval.id === item.parentId
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

  queueRetrieval(retrieval, attempt = 0) {

    debug('QUEUE retrieval (id: %s)', retrieval.description);

    return this.store.findParts({parentId: retrieval.id})
      .then((parts) => {
        return this.queue.push(
          parts.map(
            part => this.downloadPart.bind(this, part)
          ),
          RequestType.DOWNLOAD_PART,
          retrieval.id
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

        if(error instanceof QueueRejectError) return;

        debug('RETRIEVAL ERROR (%s)', retrieval.description);

        dialog.showErrorBox('Download error',
          `There was an error with ${retrieval.description} operation:
          ${error.toString()}`
        );

        retrieval.setError(error);
        return this.store.update(retrieval);
      });
  }

  downloadPart(part, attempt = 0) {

    if(part.status === PartStatus.DONE) {
      return Promise.resolve(part);
    }

    debug('DOWNLOAD PART (id: %s)', part.id);

    return this.store.get(part.parentId)
      .then((retrieval) => {

        if(!retrieval) throw new Error('Retrieval is incorrect.');

        return glacier.getRetrievalOutput({retrieval, part})
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
          }).catch((error) => {

            debug('PART ERROR (id: %s): %O', part.id, error);

            if(attempt < Defaults.RETRIEVAL_RETRY_ATTEMPTS) {

              debug('RETRY', attempt, part.id);

              return this.downloadPart(part, ++attempt);
            }

            throw error;
          });
      });
  }

  startStatusUpdater() {
    if(this.updaterStatus === ReceiverStatus.PENDING) {

      this.updaterStatus = ReceiverStatus.PROCESSING;

      const requester = () => {
        if(this.status !== ReceiverStatus.PROCESSING) {
          return this.updaterStatus = ReceiverStatus.PENDING;
        }

        this.requestPendingsStatus()
          .then((retrievals) => {

            debug('RECEIVED STATUS for %s retrievals', retrievals.length);

            if(this.status === ReceiverStatus.PROCESSING && retrievals.length) {
              setTimeout(
                requester.bind(this),
                Defaults.REQUEST_STATUS_INTERVAL
              );
            } else {
              this.updaterStatus = ReceiverStatus.PENDING;
            }
          });
      };

      requester();
    }
  }

  requestPendingsStatus() {

    return this.store.find({status: RetrievalStatus.PENDING})
      .then((retrievals) => {

        debug('PENDING %s retrievals', retrievals.length);

        return Promise.all(
          retrievals.map(
            item => this.queue.push(
              this.requestRetrievalStatus.bind(this, item),
              RequestType.GENERAL,
              item.id
            )
          )
        );

      });

  }

  requestRetrievalStatus(retrieval, attempt = 0) {
    return glacier.describeRetrieval(retrieval)
      .then((data) => {

        debug(
          'STATUS %s (action: %s, status: %s)',
          data.description, data.action, data.status
        );

        if(retrieval.status === data.status) return retrieval;

        retrieval = data;

        return this.store.update(data);
      })
      .then((retrieval) => {

        if(retrieval.status === RetrievalStatus.PROCESSING) {

          if(retrieval.action === RetrievalAction.ARCHIVE) {

            const dirname = path.dirname(retrieval.filePath);

            if(!fs.existsSync(dirname)){
              fs.mkdirSync(dirname);
            }

            const fd = fs.openSync(retrieval.filePath, 'w');
            fs.writeSync(fd, Buffer.alloc(retrieval.archiveSize));
            this.queueRetrieval(retrieval);

          }

          if(retrieval.action === RetrievalAction.INVENTORY) {
            this.updateInventory(retrieval);
          }

        }

        return retrieval;

      })
      .catch((error) => {

        if(error instanceof QueueRejectError) return;

        debug('RETRIEVAL ERROR (%s): %O',
          retrieval.description, error
        );

        if(attempt < Defaults.RETRIEVAL_RETRY_ATTEMPTS) {

          debug('RETRY (%s):', retrieval.description, attempt + 1);

          return this.requestRetrievalStatus(retrieval, ++attempt);
        } else {

          debug('RETRIEVAL ERROR (%s)', retrieval.description);

          dialog.showErrorBox('Request error',
            `There was an error with ${retrieval.description} operation:
            ${error.toString()}`
          );

          retrieval.setError(error);
          return this.store.update(retrieval);
        }
      });
  }

  updateInventory(retrieval, attempt = 0) {

    debug(
      'INVENTORY %s (status: %s)',
      retrieval.description, retrieval.status
    );

    return this.queue.push(
      glacier.getInventory.bind(null, retrieval)
    )
      .then((inventory) => {

        debug(
          'UPDATE INVENTORY %s with %s archives',
          retrieval.description,
          inventory.archives ? inventory.archives.length : 0
        );

        return this.inventory.update(inventory);
      })
      .then((inventory) => {
        debug('ACTUALIZE RETRIEVALS %s', inventory.vaultName);

        const {archives = []} = inventory;

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
              deleted.map((item) => {
                return this.queue.remove(item.id)
                  .then(() => this.store.remove(item));
              })
            );
          })
          .then(() => {

            debug('ACTUALIZE UPLOADS %s', inventory.vaultName);

            const {uploader} = global.queuer;
            return uploader.inventoryUpdate(inventory);
          });

      })
      .then(() => {

        debug('RETRIEVAL DONE %s', retrieval.description);

        return this.store.remove(retrieval);
      })
      .catch((error) => {

        if(error instanceof QueueRejectError) return;

        debug('INVENTORY ERROR (id: %s): %O',
          retrieval.description, error
        );

        if(attempt < Defaults.RETRIEVAL_RETRY_ATTEMPTS) {

          debug('RETRY (%s)', attempt, retrieval.description);

          return this.updateInventory(retrieval, ++attempt);
        } else {

          debug('INVENTORY ERROR (%s)', retrieval.description);

          dialog.showErrorBox('Inventory error',
            `There was an error with ${retrieval.description} operation:
            ${error.toString()}`
          );

          retrieval.setError(error);
          this.store.update(retrieval);
        }
      });
  }

  removeRetrieval(retrieval) {

    debug('DELETE RETRIEVAL', retrieval.description);

    retrieval.status = RetrievalStatus.HOLD;

    return this.store.update(retrieval)
      .then((retrieval) => {
        return this.queue.remove(retrieval.id);
      })
      .then(() => {
        return this.store.remove(retrieval);
      });

  }

  push(retrieval) {

    const parts = retrieval.parts;

    debug('NEW RETRIEVAL %s (%s parts)', retrieval.description, parts.length);

    return Promise.all(parts.map(
      item => this.store.createPart(item)
    ))
      .then(() => {
        return this.store.create(retrieval);
      })
      .then((retrieval) => {
        this.startStatusUpdater();
        return retrieval;
      });

  }

  subscribe(listener) {
    const unsubscribe = [
      this.store.subscribe(listener),
      this.inventory.subscribe(listener),
    ];
    return () => unsubscribe.forEach(unsubscribe => unsubscribe());
  }

  removeArchive(archive) {

    return this.inventory.get(archive.vaultName)
      .then((inventory) => {

        debug('REMOVE %s from inventory %s', archive.description, inventory.id);

        inventory.archives = inventory.archives.filter(
          item => item.id !== archive.id
        );

        return this.inventory.replace(inventory);
      });
  }

  requestInventory(vault) {

    debug('INITIATE INVENTORY (vault: %s)', vault.id);

    return this.store.find({action: RetrievalAction.INVENTORY})
      .then((retrievals) => {
        const inventoryRetrieval = retrievals.find(
          item => item.vaultName === vault.name
        );

        if(inventoryRetrieval) {
          debug('INVENTORY REQUEST FOUND (vault: %s)', vault.id);
          return inventoryRetrieval;
        }

        debug('INVENTORY REQUEST (vault: %s)', vault.id);

        return this.queue.push(
          glacier.initiateInventory.bind(null, vault)
        )
          .then(retrieval => this.store.create(retrieval));

      });

  }

  restartRetrieval(retrieval) {

    return this.store.get(retrieval.id)
      .then((retrieval) => {

        if(retrieval.status !== RetrievalStatus.ERROR) {
          return retrieval;
        }

        debug('RESTART RETRIEVAL (%s)', retrieval.description);

        retrieval.status = RetrievalStatus.PENDING;
        return this.store.update(retrieval);
      })
      .then((retrieval) => {
        return this.queue.remove(retrieval.id)
          .then(() => retrieval);
      })
      .then((retrieval) => {
        this.startStatusUpdater();
        return retrieval;
      });
  }

  stop() {
    debug('STOPPING (status: %s)', this.status);

    this.status = ReceiverStatus.PENDING;

    return this.queue.stop()
      .then(() => {
        return Promise.all([
          this.store.close(),
          this.inventory.close(),
        ]);
      })
      .then(() => {
        debug('STOPPED', this.status);
      });
  }

  isProcessing() {
    return this.queue.isProcessing();
  }

}
