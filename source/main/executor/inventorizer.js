import Debug from 'debug';
import Queue from './queue';

import {dialog} from 'electron';

import {glacier} from '../api';
import {Transfer} from '../../contracts/const';

import {
  QueueStatus,
  RetrievalStatus,
} from '../../contracts/enums';

import InventoryStore from '../storage/typed/inventory_store';

const debug = new Debug('executor:inventorizer');

export default class Inventorizer {

  constructor(queue) {
    this.queue = new Queue();
    this.store = new InventoryStore();
    this.status = QueueStatus.PENDING;
  }

  start() {
    if(this.status === QueueStatus.PENDING) {

      this.queue.start();

      debug('STARTING');

      return this.actualizeStore()
        .then(() => {
          return this.store.listRetrievals();
        })
        .then((retrievals) => {

          debug('ACTIVE %s retrievals', retrievals.length);

          if(retrievals.length > 0) {
            this.initPendingHandler();
          }

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

  remove(archive) {
    debug('REMOVE %s from inventory %s',
      archive.description, archive.vaultName);

    return this.store.get(archive.vaultName)
      .then((inventory) => {

        inventory.archives = inventory.archives.filter(
          item => item.id !== archive.id
        );

        return this.store.replace(inventory);
      });
  }

  requestInventory(vault) {

    debug('NEW REQUEST', vault.name);

    this.store.findOneRetrieval({vaultName: vault.name})
      .then((retrieval) => {

        if(retrieval) {
          debug('REQUEST EXISTS', vault.name);
          return retrieval;
        }

        debug('CREATE REQUEST', vault.name);

        return this.queue.push(
          glacier.initiateInventory.bind(null, vault)
        )
          .then((retrieval) => {
            return this.store.createRetrieval(retrieval);
          })
          .then((retrieval) => {
            this.initPendingHandler();
            return retrieval;
          });
      });

  }

  cancel(retrieval) {
    debug('REMOVE RETRIEVAL', retrieval.description);

    return this.queue.remove(retrieval)
      .then(() => {
        return this.store.removeRetrieval(retrieval);
      });

  }

  subscribe(listener) {
    debug('SUBSCRIBE to store');
    return this.store.subscribe(listener);
  }

  isProcessing() {
    return this.queue.isProcessing();
  }

  actualizeStore() {

    return this.queue.push(glacier.listVaults)
      .then((vaults) => {

        debug('GLACIER VAULTS', vaults.length);

        return Promise.all([

          this.store.listRetrievals()
            .then((retrievals) => {

              if(retrievals.length === 0) return retrievals;

              debug('ACTUALIZE %s retrievals', retrievals.length);

              return this.queue.push(vaults.map(
                vault => glacier.listRetrievals.bind(null, vault)
              ))
                .then((results) => {
                  const jobs = [].concat(...results);

                  debug('GLACIER JOBS', jobs.length);

                  const outdated = retrievals.filter(item =>
                    jobs.some(job => job.id === item.id) === false
                  );

                  if(outdated.length === 0) return retrievals;

                  debug('EXPIRED %s retrievals', outdated.length);

                  return Promise.all(
                    outdated.map(item => this.store.removeRetrieval(item))
                  )
                    .then((deleted) => {
                      return retrievals.filter(item =>
                        deleted.includes(item.id) === false
                      );
                    });

                });
            }),

          this.store.list()
            .then((inventories) => {

              if(inventories.length === 0) return inventories;

              debug('ACTUALIZE %s inventories', inventories.length);

              const deleted = inventories.filter(item =>
                vaults.some(vault => vault.name === item.vaultName) === false
              );

              if(deleted.length === 0) return inventories;

              debug('REMOVE %s inventories', deleted.length);

              return Promise.all(
                deleted.map(item => this.store.remove(item))
              )
                .then((deleted) => {
                  return inventories.filter(item =>
                    deleted.includes(item.id) === false
                  );
                });

            })
            .then((inventories) => {

              const outdated = vaults
                .filter(vault => vault.lastInventoryDate)
                .filter(vault =>
                  inventories.some(item =>
                    item.vaultName === vault.name &&
                    item.createdAt >= vault.lastInventoryDate
                  ) === false
                );

              debug('REFRESH %s inventories', outdated.length);

              return Promise.all(
                outdated.map(this.requestInventory.bind(this))
              );

            }),

        ]);
      });
  }


  initPendingHandler() {

    if(this.status === QueueStatus.PENDING) {

      debug('INIT PENDING HANDLER');

      this.status = QueueStatus.PROCESSING;

      const handler = () => {

        this.store.listRetrievals()
          .then((retrievals) => {

            debug('REQUESTING %s inventories', retrievals.length);

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
              debug('UPDATE %s inventories', retrievals.length);

              return Promise.all(
                processing.map(this.retrieveInventory.bind(this))
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

  requestRetrievalStatus(retrieval, attempt = 0) {

    return this.queue.push(
      glacier.describeRetrieval.bind(null, retrieval), {
        reference: retrieval.id,
      }
    )
      .then((response) => {

        debug('STATUS %s (status: %s)',
          retrieval.description, response.status
        );

        if(retrieval.status !== response.status) {
          return this.store.updateRetrieval(response);
        }

        return retrieval;
      })
      .catch((error) => {

        debug('RETRIEVAL ERROR (%s): %O',
          retrieval.description, error
        );

        this.store.removeRetrieval(retrieval);
      });
  }

  retrieveInventory(retrieval) {

    debug('INVENTORY %s (status: %s)',
      retrieval.description, retrieval.status
    );

    return this.queue.push(
      glacier.getInventory.bind(null, retrieval), {
        reference: retrieval.id,
      }
    )
      .then((inventory) => {

        debug('UPDATE INVENTORY %s with %s archives',
          retrieval.description, inventory.archives.length
        );

        return this.store.update(inventory);
      })
      .then((inventory) => {

        //TODO: refactor this
        const {uploader, receiver} = global.jobExecutor;

        return Promise.all([
          uploader.syncInventory(inventory),
          receiver.syncInventory(inventory),
        ]);

      })
      .then(() => {

        debug('INVENTORY UPDATED %s', retrieval.description);

        return this.store.removeRetrieval(retrieval);
      })
      .catch((error) => {

        debug('INVENTORY ERROR (id: %s): %O',
          retrieval.description, error
        );

        this.store.removeRetrieval(retrieval);
      });
  }


}
