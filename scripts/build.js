/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const EventEmitter = require('events');

const env = process.env.ENVIRONMENT === 'production' ? 'prod' : 'dev';

const main = require(`../configs/webpack.main.${env}.js`);
const renderer = require(`../configs/webpack.renderer.${env}.js`);

console.log(chalk.cyan(`Compiling project (${env})...`));

const emitter = new EventEmitter();

webpack([main, renderer], (error, stats) => {
  if(error) throw error;
  emitter.emit('done', stats.toJson());
});

emitter.on('done', (stats) => {

  if(stats.errors.length) {
    console.log(chalk.red('Failed to compile.'));
    return stats.errors.forEach(error => console.log(error));
  }

  if(stats.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.'));
    return stats.warnings.forEach(warning => console.log(warning));
  }

  console.log(chalk.green('Done successfully!'));

});
