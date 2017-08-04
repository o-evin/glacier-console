import fs from 'fs';
import path from 'path';
import {app} from 'electron';
import {defaultsDeep, isEmpty, isNil} from 'lodash';

import {Storage} from '../../contracts/const';

export default class ConfigStore {

  constructor(params) {
    const {name = Storage.CONFIG_FILE_NAME, defaults} = params || {};
    const userDataPath = app.getPath('userData');

    this.path = path.join(userDataPath, name);
    this.data = this.parse(this.path, defaults);
  }

  get(key, defaults) {
    if(isEmpty(key)) {
      var value = this.data;
    } else if(key.indexOf('.') > 0) {
      value = this.getDeep(this.data, key.split('.'));
    } else {
      value = this.data[key];
    }
    return isNil(value) ? defaults : (
      value === Object(value) ? defaultsDeep(value, defaults) : value
    );
  }

  getDeep(data, key) {
    if (key.length === 1 || isNil(data[key[0]])) {
      return data[key[0]];
    }

    return this.getDeep(data[key[0]], key.slice(1));
  }

  set(key, value) {
    if (isEmpty(key)) {
      throw new Error('Key is required.');
    } else if(key.indexOf('.') > 0) {
      this.setDeep(this.data, key.split('.'), value);
    } else {
      isNil(value) ? delete this.data[key] : this.data[key] = value;
    }

    fs.writeFileSync(this.path, JSON.stringify(this.data));
  }

  setDeep(data, key, value) {
    if(key.length === 1) {
      isNil(value) ? delete data[key[0]] : data[key[0]] = value;
    } else {
      if(isNil(data[key[0]])) {
        data[key[0]] = {};
      }
      this.setDeep(data[key[0]], key.slice(1), value);
    }
  }

  has(key) {
    return this.get(key) !== null;
  }

  remove(key) {
    this.set(key, undefined);
  }

  parse(filePath, defaults = {}) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath));
      return defaultsDeep(data, defaults);
    } catch(error) {
      return defaults;
    }
  }
}
