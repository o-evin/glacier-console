var path = require('path');
var webpack = require('webpack');

const paths = {
  root: path.resolve(''),
  source: path.resolve('source'),
  build: path.resolve('build'),
  modules: path.resolve('node_modules'),
  assets: path.resolve('source/main/assets'),
};

module.exports = {
  devtool: 'nosources-source-map',
  target: 'electron-main',
  context: paths.root,
  entry: [
    './source/main/index',
  ],
  output: {
    filename: 'main.js',
    path: paths.build,
  },
  resolve: {
    modules: [paths.modules],
    extensions: ['.js', '.json', '.node'],
  },
  module: {
    rules: [{
      test: /\.(jsx|js)$/,
      include: paths.source,
      enforce: 'pre',
      loader: 'eslint-loader',
    }, {
      test: /\.(jsx|js)$/,
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
      'process.env.ENVIRONMENT': JSON.stringify('production'),
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],

};
