import path from 'path';
import Debug from 'debug';

import {isFunction} from 'lodash';

import {glacier} from '../api';

import Queue from './queue';
import Uploader from './uploader';
import Receiver from './receiver';
import Inventorizer from './inventorizer';

const debug = new Debug('executor:main');

export default class JobExecutor {

  constructor() {
    this.queue = new Queue();
    this.uploader = new Uploader();
    this.receiver = new Receiver();
    this.inventorizer = new Inventorizer();
  }

  requestInventory(vault) {
    debug('INITIATE INVENTORY', vault.name);

    return this.inventorizer.requestInventory(vault);
  }

  cancelInventory(retrieval) {
    debug('CANCEL INVENTORY', retrieval.vaultName);
    return this.inventorizer.cancel(retrieval);
  }

  removeArchive(archive) {
    debug('REMOVE ARCHIVE', archive.description);

    return this.queue.push(
      glacier.deleteArchive.bind(null, archive.id, archive.vaultName)
    )
      .then(() => {
        return this.inventorizer.remove(archive);
      });
  }

  requestUpload(params) {
    debug('INITIATE UPLOAD %s to %s',
      path.basename(params.filePath), params.vaultName
    );

    return this.queue.push(
      glacier.initiateUpload.bind(null, params)
    )
      .then((upload) => {
        return this.uploader.push(upload);
      });

  }

  removeUpload(upload) {
    debug('REMOVE UPLOAD', upload.description);

    return this.uploader.remove(upload)
      .then(() => {
        if(upload.archiveId) {
          var handler = glacier.deleteArchive.bind(null,
            upload.archiveId, upload.vaultName
          );
        } else {
          handler = glacier.abortUpload.bind(null, upload);
        }

        return this.queue.push(handler, {reference: upload.id});
      });
  }

  restartUpload(upload) {
    debug('RESTART UPLOAD', upload.description);
    return this.uploader.restart(upload);
  }

  requestRetrieval({vaultName, archive, tier}) {
    debug('INITIATE RETRIEVAL %s from %s',
      archive.description, vaultName
    );

    const {partSizeInBytes, downloadsPath} = global.config.get('transfer');

    const filePath = path.join(downloadsPath, archive.description);

    const params = {
      filePath,
      vaultName,
      tier: tier,
      archiveId: archive.id,
      checksum: archive.checksum,
      description: archive.description,
      partSize: partSizeInBytes,
      archiveSize: archive.size,
    };

    return this.queue.push(
      glacier.initiateRetrieval.bind(null, params)
    )
      .then((retrieval) => {
        return this.receiver.push(retrieval);
      });
  }

  removeRetrieval(retrieval) {
    debug('REMOVE RETRIEVAL', retrieval.description);
    return this.receiver.remove(retrieval);
  }

  restartRetrieval(retrieval) {
    debug('RESTART RETRIEVAL', retrieval.description);
    return this.receiver.restart(retrieval);
  }

  subscribe(listener) {
    if(!isFunction(listener)) {
      throw new Error('Listener must be a function.');
    }

    const unsubscribe = [
      this.uploader.subscribe(listener),
      this.receiver.subscribe(listener),
      this.inventorizer.subscribe(listener),
    ];

    return () => unsubscribe.forEach(unsubscribe => unsubscribe());
  }

  start() {
    return Promise.all([
      this.queue.start(),
      this.uploader.start(),
      this.receiver.start(),
      this.inventorizer.start(),
    ]);
  }

  stop() {
    return Promise.all([
      this.queue.stop(),
      this.uploader.stop(),
      this.receiver.stop(),
      this.inventorizer.stop(),
    ]);
  }

  isProcessing() {
    return this.queue.isProcessing() ||
      this.uploader.isProcessing() ||
      this.receiver.isProcessing();
  }

}
