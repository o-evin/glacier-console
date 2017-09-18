import uuid from 'uuid';

import {isNil} from  'lodash';
import {Part} from '../entities';

import {
  RetrievalAction,
  RetrievalStatus,
  RetrievalTier,
  RetrievalType,
  PartStatus,
} from '../enums';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'type':
              if (Object.values(RetrievalType).indexOf(value) < 0) {
                throw new Error('Retrieval type is not valid.');
              }
              break;
            case 'status':
              if (Object.values(RetrievalStatus).indexOf(value) < 0) {
                throw new Error('Retrieval status is not valid.');
              }
              break;
            case 'action':
              if (Object.values(RetrievalAction).indexOf(value) < 0) {
                throw new Error('Retrieval action is not valid.');
              }
              break;
            case 'tier':
              if (Object.values(RetrievalTier).indexOf(value) < 0) {
                throw new Error('Retrieval tier is not valid.');
              }
              break;
            case 'archiveSize':
              if (!Number.isInteger(value)) {
                value = parseInt(value);
              }
              break;
            case 'createdAt':
            case 'completedAt':
              if (!(value instanceof Date)) {
                value = new Date(value);
              }
              break;
          }
        }

        object[key] = value;
        return true;
      },
    });
  }
}


export default class Retrieval extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = raw.id;
    this.action = raw.action;
    this.archiveId = raw.archiveId;
    this.archiveSize = raw.archiveSize;
    this.partSize = raw.partSize;
    this.checksum = raw.checksum;
    this.createdAt = raw.createdAt;
    this.completedAt = raw.completedAt;
    this.description = raw.description;
    this.status = raw.status;
    this.tier = raw.tier;
    this.filePath = raw.filePath;
    this.vaultName = raw.vaultName;
    this.error = raw.error;

  }

  getParts() {
    const parts = [];

    for (let pos = 0; pos < this.archiveSize; pos += this.partSize) {

      const size = Math.min(this.partSize, this.archiveSize - pos);
      const range = `bytes=${pos}-${pos + size - 1}`;

      const part = new Part({
        id: uuid.v4(),
        size: size,
        range: range,
        position: pos,
        parentId: this.id,
        status: PartStatus.PROCESSING,
      });

      parts.push(part);
    }

    return parts;
  }

  setError(error) {
    this.status = RetrievalStatus.ERROR;
    this.error = error.message || error.toString();
    return this;
  }

}
