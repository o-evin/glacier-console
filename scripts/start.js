/* eslint-disable no-console */
const chalk = require('chalk');
const webpack = require('webpack');
const detect = require('detect-port');
const prompt = require('prompt');

const WebpackDevServer = require('webpack-dev-server');

const main = require('../configs/webpack.main.dev.js');
const renderer = require('../configs/webpack.renderer.dev.js');

const {exec} = require('child_process');

const DEFAULT_PORT = process.env.PORT || 8080;

function compile() {

  console.log(chalk.cyan('Compiling project...'));
  console.log();

  const options = {
    quiet: true,
    inline: true,
    stats: {
      colors: true,
    },
    host: 'localhost',
    port: DEFAULT_PORT,
    historyApiFallback: true,
    contentBase: renderer.output.path,
    watchOptions: {
      ignored: /node_modules/,
    },
  };

  WebpackDevServer.addDevServerEntrypoints(renderer, options);

  const compiler = webpack([renderer, main], (err, stats) => {

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
    }

    console.log(
      chalk.cyan('Starting development web server on '),
      chalk.yellow(`http://localhost:${DEFAULT_PORT}/`)
    );
    console.log();

    new WebpackDevServer(compiler.compilers.shift(), options)
      .listen(DEFAULT_PORT, (err, result) => {
        if (err) {
          return console.log(err);
        }

        console.log(chalk.cyan('Starting electron...'));
        console.log();

        const child = exec('npm run electron');

        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);

        child.on('close', function(data) {
          process.exit();
        });

      });
  });
}


detect(DEFAULT_PORT).then((port) => {

  if (port === DEFAULT_PORT) {
    return compile();
  }

  const question = chalk.yellow(
    `Something is already running at port ${DEFAULT_PORT}.\n\n`
  ) + 'Would you like to terminate the app listening to this port?';

  prompt(question, true)
    .then((shouldTerminate) => {
      if (shouldTerminate) {
        exec('kill -9 $(lsof -t -i:' + DEFAULT_PORT + ' -c node -a)', (err) => {
          if (err) return console.log(`exec error: ${err}`);
          compile();
        });
      }
    });
});
