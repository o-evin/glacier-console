import fs from 'fs';
import util from 'util';
import path from 'path';

import {app} from 'electron';
import {Logger, transports} from 'winston';

const level = process.env.LOG_LEVEL || (
  process.env.NODE_ENV === 'production' ? 'error' : 'debug'
);

const options = {
  timestamp: function() {
    return new Date().toISOString();
  },
  formatter: (options) => {
    return options.timestamp() + ' ' + options.message;
  },
};

const userData = app.getPath('userData');
const logPath = path.join(userData, 'logs');

if (!fs.existsSync(logPath)){
  fs.mkdirSync(logPath);
}

const DailyRotateFile = require('winston-daily-rotate-file');

const logger = new Logger({
  level,
  transports: [
    new DailyRotateFile({
      ...options,
      maxDays: 90,
      prepend: true,
      level: 'error',
      name: 'error-file',
      zippedArchive: true,
      datePattern: 'yyyy-MM-dd-',
      filename: path.join(logPath, 'error.log'),
    }),
    new DailyRotateFile({
      ...options,
      maxDays: 7,
      prepend: true,
      name: 'combined-file',
      zippedArchive: true,
      datePattern: 'yyyy-MM-dd-',
      filename: path.join(logPath, 'combined.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(transports.Console, options);
}

export default (namespace = 'glacier', level = 'debug') => {
  return (message, ...params) => {
    message = `${namespace}: ${util.format(message, ...params)}`;
    return logger.log(level, message);
  };
};
