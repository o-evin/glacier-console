/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');

const env = process.env.ENVIRONMENT === 'production' ? 'prod' : 'dev';

const main = require(`../configs/webpack.main.${env}.js`);
const renderer = require(`../configs/webpack.renderer.${env}.js`);

console.log(chalk.cyan(`Compiling project (${env})...`));
console.log();

webpack([main, renderer], (err, stats) => {

  const json = stats.toJson();

  if (stats.hasErrors()) {
    console.log(chalk.red('Failed to compile.'));
    console.log();
    json.errors.forEach((message) => {
      console.log(message);
      console.log();
    });
    return;
  }

  if (stats.hasWarnings()) {
    console.log(chalk.yellow('Compiled with warnings.'));
    console.log();

    json.warnings.forEach((message) => {
      console.log(message);
      console.log();
    });

    console.log();
    console.log('You may use special comments to disable some warnings.');
    console.log('Use ' + chalk.yellow('// eslint-disable-next-line') +
      ' to ignore the next line.');
    console.log('Use ' + chalk.yellow('/* eslint-disable */') +
      ' to ignore all warnings in a file.');
    console.log();

    return;

  }

  console.log(chalk.green('Done successfully!'));
  console.log();

});
