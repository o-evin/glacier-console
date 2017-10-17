import path from 'path';
import {isNil} from 'lodash';

export default class Folder {
  constructor(raw) {

    if(isNil(raw)) {
      raw = new Object();
    }

    this.prefix = raw.prefix;
    this.uploads = raw.uploads || [];
    this.archives = raw.archives || [];
    this.retrievals = raw.retrievals || [];

    Object.defineProperty(this, 'title', {
      enumerable: true,
      get: () => {
        return path.basename(this.prefix);
      },
    });
  }

  get hasStats() {
    return this.uploads.length > 0 || this.archives.length > 0;
  }

}
