'use strict';
const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin'); // aliasing this back to webpack.optimize.UglifyJsPluginis is scheduled for webpack v4.0.0
const FileManagerPlugin = require('filemanager-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

let config = {
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
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
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
              sourceMap: true
            }
          }
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              minimize: false,
              sourceMap: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      })
    }
  ]
};

// ----------------
// PLUGINS

config.plugins = []; // add new key 'plugins' of type array to config object

// ----------------
// WEBPACK DEFINE PLUGIN
// ALWAYS

config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    // 'DEBUG': JSON.stringify(process.env.DEBUG || development),
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
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
// WEBPACK BUILT IN OPTIMIZATION
// ALWAYS

// ModuleConcatenationPlugin
config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

// ----------------
// WEBPACK BUILT IN OPTIMIZATION
// IN PRODUCTION

if (production) {
  config.plugins.push(new UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
      compress: {
        sequences: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        drop_console: false,
        warnings: false
      },
      mangle: false,
      output: {
        comments: false,
        beautify: false
      }
    },
    extractComments: false,
    sourceMap: false
  }));
}

// ----------------
// FileManagerPlugin

config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      {
        source: path.join(__dirname, 'src/preflight/*.{js,css}'),
        destination: outputPath
      }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// ExtractTextPlugin

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: false, // always enabled for now
  allChunks: true
}));

module.exports = config;
