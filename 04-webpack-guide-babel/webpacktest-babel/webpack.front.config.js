'use strict';
const path = require('path');
const webpack = require('webpack');
const pkgConfig = require('./package.json');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// PUBLIC PATH based on env

let publicPath;
let targetHost;
if (production) {
  publicPath = `//${pkgConfig.config.hostProduction}${pkgConfig.config.pathAboveRootProduction}/assets/`;
  targetHost = pkgConfig.config.hostProduction;
} else if (staging) {
  publicPath = `//${pkgConfig.config.hostStaging}${pkgConfig.config.pathAboveRootStaging}/assets/`;
  targetHost = pkgConfig.config.hostStaging;
} else if (testing) {
  publicPath = `//${pkgConfig.config.hostTesting}${pkgConfig.config.pathAboveRootTesting}/assets/`;
  targetHost = pkgConfig.config.hostTesting;
} else {
  publicPath = `http://${pkgConfig.config.hostDevelopment}:${pkgConfig.config.portFrontendWebpackDevServerHTTP}${pkgConfig.config.pathAboveRootDevelopment}/assets/`;
  targetHost = pkgConfig.config.hostDevelopment;
}

console.log('publicPath \x1b[36m%s\x1b[0m', publicPath);
console.log('targetHost \x1b[36m%s\x1b[0m', targetHost);

// ----------------
// SOURCE MAP CONF
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// BASE CONFIG

let config = {
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    site: [
      'babel-polyfill',
      'classlist-polyfill',
      path.join(__dirname, 'src/site.js')
    ],
    preflight: './src/preflight.js'
  },
  output: {
    path: path.join(__dirname, 'public/assets'),
    filename: '[name].js',
    publicPath
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
// WEBPACK DEV SERVER
// https://webpack.js.org/configuration/dev-server/#devserver

config.devServer = {
  clientLogLevel: 'info',
  compress: true,
  contentBase: false, // path.join(__dirname, 'public'),
  // filename: 'site.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  historyApiFallback: true,
  host: targetHost, // CLI ONLY

  // either use cli --hot (and --inline) or this config flag
  // when using this config we need to manually also add webpack.HotModuleReplacementPlugin()
  hot: pkgConfig.config.isWebpackDevServerHot,
  // hotOnly: true

  https: pkgConfig.config.isWebpackDevServerFrontendHTTPS,
  // https: {
  //   key: fs.readFileSync("/path/to/server.key"),
  //   cert: fs.readFileSync("/path/to/server.crt"),
  //   ca: fs.readFileSync("/path/to/ca.pem"),
  // }

  inline: true, // CLI ONLY
  // lazy: true,
  noInfo: false,
  overlay: {
    warnings: false,
    errors: true
  },
  port: pkgConfig.config.portFrontendWebpackDevServerHTTP,
  // proxy: {
  //   '/api': 'http://localhost:3000'
  // },
  // progress: true, // CLI only
  // public: 'myapp.test:80',
  publicPath,
  quiet: false
  // setup: null,
  // staticOptions: null,
  // stats: null,
  // watchContentBase: true,
  // watchOptions: {
  //   poll: true
  // },
  // -d is shorthand for --debug --devtool source-map --output-pathinfo
};

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      use: 'babel-loader'
    },
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
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  'process.env.BROWSER': true,
  __CLIENT__: true,
  __SERVER__: false,
  __DEV__: development,
  __DEVELOPMENT__: development,
  __DEVTOOLS__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production,
  __HOST__: targetHost,
  __PORT_FRONT_APP_HTTP1__: pkgConfig.config.portFrontendAppHTTP1, // JSON.stringify
  __PORT_FRONT_APP_HTTP2__: pkgConfig.config.portFrontendAppHTTP2
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
// HtmlWebpackPlugin

config.plugins.push(new HtmlWebpackPlugin({
  title: `WEBPACK GUIDE - ${pkgConfig.name}`,
  filename: `${path.join(__dirname, 'public')}/index.html`,
  template: 'src/index.template.ejs',
  inject: false, // we specify manually where we want our entry outputs to be in the template
  // favicon: ,
  minify: false,
  hash: false,
  cache: true,
  showErrors: true,
  // chunks: ['site', 'preflight'],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true
}));
config.plugins.push(new HtmlWebpackHarddiskPlugin());

// ----------------
// Hot reloading

if (development && pkgConfig.config.isWebpackDevServerHot) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
}

// ----------------
// ExtractTextPlugin CONFIG

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: development, // disable when development
  allChunks: true
}));

// ----------------
// POSTCSS LOADER CONFIG

// defined in .postcssrc.js

// ----------------
// BROWSERLIST CONFIG

// defined in .browserslistrc

// ----------------
// BABEL CONFIG

// defined in .babelrc

module.exports = config;
