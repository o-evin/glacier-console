import uuid from 'uuid';
import {isNil} from  'lodash';
import {Part} from '../entities';
import {UploadStatus, PartStatus} from '../enums';

class Validator {
  constructor() {
    return new Proxy(this, {
      set: (object, key, value, proxy) => {

        if(value) {
          switch (key) {
            case 'status':
              if (Object.values(UploadStatus).indexOf(value) < 0) {
                throw new Error('Upload status is not valid.');
              }
              break;
            case 'createdAt':
              if (!(value instanceof Date)) {
                value = new Date(value);
              }
              break;
            case 'partSize':
            case 'archiveSize':
              if (!Number.isInteger(value)) {
                value = parseInt(value);
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


export default class Upload extends Validator {
  constructor(raw) {
    super();

    if(isNil(raw)) {
      raw = new Object();
    }

    this.id = raw.id;
    this.archiveId = raw.archiveId;
    this.partSize = raw.partSize;
    this.status = raw.status;
    this.location = raw.location;
    this.filePath = raw.filePath;
    this.pathRoot = raw.pathRoot;
    this.vaultName = raw.vaultName;
    this.archiveSize = raw.archiveSize;
    this.checksum = raw.checksum;
    this.createdAt = raw.createdAt;
    this.completedAt = raw.completedAt;
    this.description = raw.description;
    this.error = raw.error;

  }

  getParts() {
    const parts = [];

    for (let pos = 0; pos < this.archiveSize; pos += this.partSize) {

      const size = Math.min(this.partSize, this.archiveSize - pos);
      const range = `bytes ${pos}-${pos + size - 1}/*`;

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
    this.error = error.message || error.toString();
    this.status = UploadStatus.ERROR;
    return this;
  }

}
