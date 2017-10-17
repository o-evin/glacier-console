const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const paths = {
  root: path.resolve(''),
  build: path.resolve('build'),
  source: path.resolve('source'),
  modules: path.resolve('node_modules'),
  assets: path.resolve('source/renderer/assets'),
};

module.exports = {
  target: 'electron-renderer',
  context: paths.root,
  entry: [
    './source/renderer',
  ],
  output: {
    filename: 'bundle.js',
    path: paths.build,
  },
  resolve: {
    modules: [paths.modules],
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [{
      test: /\.(jsx|js)$/,
      include: paths.source,
      enforce: 'pre',
      loader: 'eslint-loader',
    }, {
      test: /\.(jsx|js)$/,
      enforce: 'post',
      include: paths.source,
      loader: 'react-hot-loader',
    }, {
      test: /\.(jsx|js)$/,
      include: paths.source,
      loader: 'babel-loader',
    }, {
      test: /\.scss$/,
      include: paths.assets,
      loader: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: ['css-loader', 'sass-loader'],
      }),
    }, {
      test: /\.(jpe?g|png|gif|ico|ttf|svg|eot|woff(2)?)(\?.*)?$/,
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
    new ExtractTextPlugin('style.css'),
    new HtmlWebpackPlugin({
      template: 'source/renderer/index.html',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
  ],
};
