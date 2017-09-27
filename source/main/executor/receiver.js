import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import Debug from 'debug';
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

const debug = new Debug('executor:receiver');

export default class Receiver {

  constructor(queue) {
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
          return this.actualizeRetrievals(retrievals);
        })
        .then((retrievals) => {

          if(retrievals.length === 0) return retrievals;

          const pending = retrievals.filter(item =>
            item.status === RetrievalStatus.PENDING
          );

          if(pending.length > 0) {
            debug('PENDING %s retrievals', pending.length);
            pending.forEach(item => this.processRetrieval(item));
          }

          const processing = retrievals.filter(item =>
            item.status === RetrievalStatus.PROCESSING
          );

          if(processing.length > 0) {
            debug('ACTIVE %s retrievals', processing.length);
            processing.forEach(item => this.download(item));
          }

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

  remove(retrieval) {
    debug('DELETE RETRIEVAL', retrieval.description);

    return this.stopRetrieval(retrieval)
      .then(() => {
        return this.store.remove(retrieval);
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

  stopRetrieval(retrieval) {
    debug('STOP RETRIEVAL (%s)', retrieval.description);
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

  processRetrieval(retrieval) {
    return this.waiter.push(
      glacier.describeRetrieval.bind(null, retrieval),
      {status: RetrievalStatus.PROCESSING},
      {reference: retrieval.id},
    )
      .then(retrieval => this.download(retrieval))
      .catch((error) => {

        if(error instanceof HandledRejectionError) return;

        debug('ERROR (retrieval: %s): %O', retrieval.description, error);

        retrieval.setError(error);
        return this.store.update(retrieval);
      });
  }

  download(retrieval) {
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
      const fd = fs.openSync(filePath, 'w');
      fs.writeSync(fd, Buffer.alloc(archiveSize));
    }

    return this.downloadMultipart(retrieval)
      .then(() => {

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

        debug('ERROR (retrieval: %s): %O', retrieval.description, error);

        this.stopRetrieval(retrieval);

        retrieval.setError(error);
        return this.store.update(retrieval);
      });
  }

  downloadMultipart(retrieval) {
    debug('DOWNLOAD MULTIPART', retrieval.description, retrieval.position);

    const parts = retrieval.getPendingParts();
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
    );
  }

  downloadPart(retrieval, part) {

    debug('DOWNLOAD RANGE', retrieval.description, part.range);

    return this.queue.push(glacier.getRetrievalOutput, {
      type: RequestType.DOWNLOAD_PART,
      reference: part.parentId,
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
