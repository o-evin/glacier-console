import url from 'url';
import path from 'path';

import {app, dialog, BrowserWindow, Menu} from 'electron';

import JobExecutor from './executor';
import ConfigStore from './storage/config_store';
import {Transfer} from '../contracts/const';

import {glacier} from './api';

import logo from './assets/icons/png/64x64.png';

let win;

const defaults = {
  transfer: {
    partSizeInBytes: Transfer.PART_SIZE_IN_BYTES,
    maximumActiveParts: Transfer.ACTIVE_PARTS_LIMIT,
    downloadsPath: app.getPath('downloads'),
  },
};

global.glacier = glacier;
global.config = new ConfigStore({defaults});

const jobExecutor = new JobExecutor();
global.jobExecutor = jobExecutor;

global.auth = {
  aws: null,
};

const appPath = app.getAppPath();

app.on('ready', createWindow);

function createWindow() {

  win = new BrowserWindow({
    show: false,
    icon: path.resolve(appPath, 'build', logo),
  });

  win.loadURL(url.format({
    pathname: path.resolve(appPath, 'build', 'index.html'),
    protocol: 'file:',
    slashes: true,
  }));

  if(process.env.ENVIRONMENT === 'development') {
    win.webContents.openDevTools();
  }

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', closeWindow);

  Menu.setApplicationMenu(Menu.buildFromTemplate([{
    label: 'Application',
    submenu: [
      {role: 'close'},
    ]}, {
    label: 'Edit',
    submenu: [
      {role: 'undo'},
      {role: 'redo'},
      {type: 'separator'},
      {role: 'cut'},
      {role: 'copy'},
      {role: 'paste'},
      {role: 'pasteandmatchstyle'},
      {role: 'delete'},
      {role: 'selectall'},
    ]},
  ]));
}

function closeWindow(event) {
  if (!app.forceQuit && jobExecutor.isProcessing()) {

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
  jobExecutor.stop()
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
