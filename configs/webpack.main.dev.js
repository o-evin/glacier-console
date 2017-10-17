const path = require('path');
const webpack = require('webpack');

const paths = {
  root: path.resolve(''),
  build: path.resolve('build'),
  source: path.resolve('source'),
  modules: path.resolve('node_modules'),
  assets: path.resolve('source/main/assets'),
};

module.exports = {
  target: 'electron',
  context: paths.root,
  entry: [
    './source/main',
  ],
  output: {
    filename: 'main.js',
    path: paths.build,
  },
  resolve: {
    modules: [paths.modules],
    extensions: ['.js', '.json'],
  },
  module: {
    rules: [{
      test: /\.js$/,
      include: paths.source,
      enforce: 'pre',
      loader: 'eslint-loader',
    }, {
      test: /\.js$/,
      include: paths.source,
      loader: 'babel-loader',
    }, {
      test: /\.(jpe?g|png|gif|ico|icns|ttf|svg|eot|woff(2)?)(\?.*)?$/,
      include: paths.assets,
      loader: 'file-loader',
    }],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        ENVIRONMENT: JSON.stringify('development'),
        NODE_ENV: JSON.stringify('development'),
        PORT: JSON.stringify('8080'),
      },
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],

};
