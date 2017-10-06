import {isNil} from  'lodash';
import {Part} from '../entities';
import {UploadStatus} from '../enums';

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
            case 'position':
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
    this.filePath = raw.filePath;
    this.vaultName = raw.vaultName;
    this.archiveSize = raw.archiveSize;
    this.checksum = raw.checksum;
    this.createdAt = raw.createdAt;
    this.completedAt = raw.completedAt;
    this.description = raw.description;
    this.error = raw.error;

    this.position = raw.position || 0;
    this.completedSequences = raw.completedSequences || [];
  }

  get completion() {
    return Math.round((this.finishedSize / this.archiveSize) * 100);
  }

  get finishedSize() {
    return this.position + this.completedSequences.reduce((sum, position) => {
      return sum + Math.min(this.partSize, this.archiveSize - position);
    }, 0);
  }

  getPendingParts() {
    const parts = [];

    let position = this.position;

    while(position < this.archiveSize) {
      const size = Math.min(this.partSize, this.archiveSize - position);

      if(this.completedSequences.indexOf(position) < 0) {
        const range = `bytes ${position}-${position + size - 1}/*`;
        parts.push(new Part({size, range, position}));
      }

      position += size;
    }

    return parts;
  }

  addSequence(position) {
    if(this.position === position) {
      this.position += Math.min(this.partSize, this.archiveSize - position);

      const nextIndex = this.completedSequences.indexOf(this.position);

      if(nextIndex >= 0) {
        this.completedSequences.splice(nextIndex, 1);
        this.addSequence(this.position);
      }
    } else {
      this.completedSequences.push(position);
    }
  }

  setError(error) {
    this.error = error.message || error.toString();
    this.status = UploadStatus.ERROR;
    return this;
  }

}
