'use strict';
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('GLOBAL ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Output public path
const outputPublicPathBuilt = '/assets/';

// ----------------
// Output fs path
const outputFsPath = path.join(__dirname, 'public/assets');

// ----------------
// Config
let config = {
  mode: development ? 'development' : 'production',
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputFsPath,
    publicPath: outputPublicPathBuilt,
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.resolve('./src/'),
      'src',
      'node_modules',
      'bower_components'
    ]
  }
};

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            sourceMap: true
          }
        }
      ],
    },
    {
      test: /\.(scss)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            sourceMap: true
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }
      ],
    }
  ]
};

// ----------------
// OPTIMISATION

config.optimization = {
  minimize: true, // can override
  minimizer: [
    new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      // include: '',
      // exclude: '',
      chunkFilter: (chunk) => {
        return true;
      },
      cache: true,
      // cacheKeys: (defaultCacheKeys, file) => {},
      parallel: true,
      sourceMap: false,
      // minify: (file, sourceMap) => {},
      warningsFilter: (warning, source, file) => {
        return true;
      },
      extractComments: false,
      terserOptions: {
        ecma: undefined,
        warnings: true,
        parse: {},
        compress: {},
        mangle: false,
        module: false,
        output: {
          comments: false
        },
        sourceMap: false,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false
      }
    }),
    new OptimizeCSSAssetsPlugin({
      //
    })
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// DefinePlugin
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': (development) ? JSON.stringify('development') : JSON.stringify('production'),
    'BROWSER': true
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEV__: development,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production,
  __DEVTOOLS__: development
}));

// ----------------
// ModuleConcatenationPlugin
if (!development) {
  // config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin()); // enabled in production mode by default https://webpack.js.org/configuration/mode/
}

// ----------------
// FileManagerPlugin
config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      {
        source: path.join(__dirname, 'src/preflight/*.{js,css}'),
        destination: outputFsPath
      }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: '[name].css',
  chunkFilename: '[id].css',
}));

module.exports = config;