import fs from 'fs';
import path from 'path';
import Datastore from 'nedb';

import {app} from 'electron';
import {Storage} from '../../contracts/const';

export default class IndexedStore {

  constructor(params) {
    const {pathname = Storage.DATABASE_DIR} = params || {};
    this.path = path.join(app.getPath('userData'), pathname);
    this.stores = [];
  }

  close(storeName) {

    if(!storeName) {
      throw new Error('Store name is required.');
    }

    return new Promise((resolve, reject) => {
      delete this.stores[storeName];
      return resolve();
    });
  }

  reset(storeName) {

    if(!storeName) {
      throw new Error('Store name is required.');
    }

    return this.close(storeName)
      .then(() => {
        const {region} = global.auth.aws;
        rmdir(path.join(this.path, region, storeName));
      });
  }

  getStore(name) {

    if(!this.stores[name]) {
      const {region} = global.auth.aws;
      const store = new Datastore({
        filename: path.join(this.path, region, name),
        autoload: true,
      });

      this.stores[name] = store;
    }

    return this.stores[name] ;
  }

  list(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.find({}, (error, result) => {
        if(error) return reject(error);
        resolve(result);
      });
    });
  }

  create(storeName, value) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.insert(value, (error) => {
        if(error) return reject(error);
        resolve(value);
      });
    });
  }

  update(storeName, value) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.update({id: value.id}, value, {}, (error) => {
        if(error) return reject(error);
        resolve(value);
      });
    });
  }

  remove(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.remove({id}, {}, (error) => {
        if(error) return reject(error);
        resolve(id);
      });
    });
  }

  get(storeName, id) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.findOne({id}, (error, result) => {
        if(error) return reject(error);
        resolve(result);
      });
    });
  }

  getMany(storeName, fieldName, value) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.find({[fieldName]: value}, (error, result) => {
        if(error) return reject(error);
        resolve(result);
      });
    });
  }

  findBy(storeName, fieldName, value) {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName);
      store.findOne({[fieldName]: value}, (error, result) => {
        if(error) return reject(error);
        resolve(result);
      });
    });
  }

}

function rmdir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((entry) => {
      const entryPath = path.join(dirPath, entry);
      if (fs.lstatSync(entryPath).isDirectory()) {
        rmdir(entryPath);
      } else {
        fs.unlinkSync(entryPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}
