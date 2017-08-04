import url from 'url';
import path from 'path';

import {app, dialog, BrowserWindow} from 'electron';

import Queuer from './queuer';
import ConfigStore from './storage/config_store';

import * as glacier from './api/glacier';

import logo from './assets/icons/png/64x64.png';

let win;

global.config = new ConfigStore();
global.queuer = new Queuer();
global.glacier = glacier;

global.auth = {
  aws: null,
};

app.on('ready', createWindow);

function createWindow() {

  win = new BrowserWindow({
    show: false,
    icon: path.join(app.getAppPath(), 'build', logo),
  });

  if(process.env.ENVIRONMENT === 'development') {

    const port = process.env.PORT || 8080;

    win.loadURL(`http://localhost:${port}/index.html`);
    win.webContents.openDevTools();

  } else {

    win.loadURL(url.format({
      pathname: path.join(app.getAppPath(), 'build/index.html'),
      protocol: 'file:',
      slashes: true,
    }));

  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', closeWindow);
}

function closeWindow(event) {
  if (!app.forceQuit && global.queuer.isProcessing()) {

    event.preventDefault();

    const params = {
      type: 'question',
      buttons: ['Yes', 'No'],
      title: 'Confirm',
      message: 'The archive transfer operations are running in the ' +
        'background. Are you sure you want to terminate all background ' +
        'jobs and quit?',
    };

    dialog.showMessageBox(params, (response) => {
      if (response === 0) {
        app.forceQuit = true;
        win.close();
      }
    });
  }
}

app.on('window-all-closed', () => {
  global.queuer.stop()
    .then(() => {
      app.quit();
    });
});

const isSecondInstance = app.makeSingleInstance(
  (commandLine, workingDirectory) => {
    // Focus existing window.
    if(win) {
      if(win.isMinimized()) {
        win.restore();
      }
      win.focus();
    }
  }
);

if (isSecondInstance) {
  app.quit();
}
