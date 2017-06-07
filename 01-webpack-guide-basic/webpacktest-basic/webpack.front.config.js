'use strict';
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// SOURCE MAP CONF

const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// BASE CONFIG

let config = {
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    site: './src/site.js',
    preflight: './src/preflight.js'
  },
  output: {
    path: path.join(__dirname, 'public/assets'),
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
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
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
              importLoaders: 3,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
    // raster and vector images (we need to exclude possible svg webfont)
    {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        },
        (production)
          ? {
            loader: 'image-webpack-loader'
          }
          : null
      ].filter((e) => e !== null)
    },
    // webfont files always have to be ended with *-webfont.ext
    {
      test: /.-webfont\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: 'url-loader?limit=100&mimetype=application/vnd.ms-fontobject'
    },
    {
      test: /.-webfont\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: 'url-loader?limit=100&mimetype=application/font-woff2'
    },
    {
      test: /.-webfont\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: 'url-loader?limit=100&mimetype=application/font-woff'
    },
    {
      test: /.-webfont\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: 'url-loader?limit=100&mimetype=application/x-font-ttf'
    },
    {
      test: /.-webfont\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: 'url-loader?limit=100&mimetype=image/svg+xml'
    }
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// WEBPACK DEFINE PLUGIN
// define environmental variables into scripts

config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production,
  __DEVTOOLS__: development
}));

// ----------------
// WEBPACK BUILT IN OPTIMIZATION

if (production) {
  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
  config.plugins.push(new webpack.optimize.LimitChunkCountPlugin({maxChunks: 15}));
  config.plugins.push(new webpack.optimize.MinChunkSizePlugin({minChunkSize: 10000}));
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: true,
      warnings: false
    },
    mangle: false,
    beautify: false,
    output: {
      space_colon: false,
      comments: false
    },
    extractComments: false,
    sourceMap: sourceMapType
  }));
}

// ----------------
// ExtractTextPlugin CONFIG

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: false, // always enabled for now
  allChunks: true
}));

// ----------------
// POSTCSS LOADER CONFIG

// defined in .postcssrc.js

// ----------------
// BROWSERLIST CONFIG

// defined in .browserslistrc

module.exports = config;
