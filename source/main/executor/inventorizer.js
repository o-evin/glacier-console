import Debug from 'debug';
import {dialog} from 'electron';

import Queue from './queue';
import Waiter from './waiter';
import InventoryStore from '../storage/typed/inventory_store';

import {glacier} from '../api';

import {
  QueueStatus,
  RetrievalStatus,
} from '../../contracts/enums';

import {HandledRejectionError} from '../../contracts/errors';

const debug = new Debug('executor:inventorizer');

export default class Inventorizer {

  constructor(queue) {
    this.queue = new Queue();
    this.waiter = new Waiter();
    this.store = new InventoryStore();
    this.status = QueueStatus.PENDING;
  }

  start() {
    if(this.status === QueueStatus.PENDING) {

      debug('STARTING');
      this.queue.start();
      this.waiter.start();

      this.status = QueueStatus.PROCESSING;

      return this.actualizeStore()
        .then(() => {
          return this.store.listRetrievals();
        })
        .then((retrievals) => {

          debug('ACTIVE %s retrievals', retrievals.length);
          retrievals.forEach(item => this.processRetrieval(item));

          debug('INIT DONE');

        })
        .catch((error) => {

          if(error instanceof HandledRejectionError) return;

          debug('APP ERROR');

          dialog.showErrorBox('A fatal error',
            `Unable to start a receiver queue. Please restart the application.
            ${error.toString()}`
          );

          debug('ERROR (%O)', error);
        });

    }
  }

  processRetrieval(retrieval) {
    return this.waiter.push(
      glacier.describeRetrieval.bind(null, retrieval),
      {status: RetrievalStatus.PROCESSING},
      {reference: retrieval.id},
    )
      .then(retrieval => this.retrieveInventory(retrieval))
      .catch((error) => {

        if(error instanceof HandledRejectionError) return;

        debug('INVENTORY ERROR (id: %s): %O',
          retrieval.description, error
        );

        this.store.removeRetrieval(retrieval);
      });
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

    return this.store.findOneRetrieval({vaultName: vault.name})
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
            this.processRetrieval(retrieval);
            return retrieval;
          });
      });

  }

  cancel(retrieval) {
    debug('REMOVE RETRIEVAL', retrieval.description);

    return Promise.all([
      this.queue.remove(retrieval),
      this.waiter.remove(retrieval),
    ])
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

              return this.queue.push(
                vaults.map(
                  vault => glacier.listRetrievals.bind(null, vault)
                )
              )
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
                outdated.map(
                  item => this.requestInventory(item)
                )
              );

            }),

        ]);
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

        if(error instanceof HandledRejectionError) return;

        debug('INVENTORY ERROR (id: %s): %O',
          retrieval.description, error
        );

        this.store.removeRetrieval(retrieval);
      });
  }


}
