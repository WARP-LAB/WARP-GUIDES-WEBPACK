// webpack config file

/* eslint-disable prefer-const, brace-style */

'use strict';

const fs = require('fs');
const path = require('path');
const appProps = require(path.resolve(__dirname, 'properties.json'));
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
// const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // Use while PostCSS is not introduced
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// ----------------
// ENV
let tierName;
let development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
if (production) {
  tierName = 'production';
} else if (staging) {
  tierName = 'staging';
} else if (testing) {
  tierName = 'testing';
} else {
  tierName = 'development';
  development = true; // fall back to development
}

// ----------------
// Current tier props
const currTierProps = appProps.tiers[tierName];

// ----------------
// webpack DevServer OOB adds this ENV variable
const devServerRunning = !!process.env.WEBPACK_DEV_SERVER;

// ----------------
// User defined flag to set static file serving for webpack DevServer
const devServerServeStatic = !!process.env.DEV_SERVE_STATIC && process.env.DEV_SERVE_STATIC === 'true';

// ----------------
// Output filesystem path
const appPathFsBase = path.join(__dirname, 'public/'); // file system path, used to set application base path for later use
const appPathFsBuild = path.join(appPathFsBase, 'assets/'); // file system path, used to set webpack.config.output.path a.o. uses

// ----------------
// Output URL path
// File system paths do not necessarily reflect in URL paths, thus construct them separately
const appPathUrlBuildRelativeToApp = 'assets/'; // URL path for appPathFsBuild, relative to app base path
const appPathUrlBuildRelativeToServerRoot = `/${appPathUrlBuildRelativeToApp}`; // URL path for appPathFsBuild, relative to webserver root

// ----------------
// Host, port, output public path based on env and props

// Declarations

let appProtocolPrefix; // protocol prefix 'https:' or 'http:'
let appFqdn; // FQDN (hostname.domain.tld)
let appPortNumber; // for example 3000
let appPortWithSuffix; // if some custom port is specified, construct string for URL generation, i.e., ':3000'
let appUrlPathAboveServerRoot; // 'some/path/above/webroot/'

let appPathUrlBaseWithPort; // app base URL (with custom port, if exists), usually domain root, but can be subpath
let appPathUrlBaseNoPort; // app base URL without any port designation

let appPathUrlBuildWithPort; // ULR to built assets
let appPathUrlBuildNoPort; // ULR to built assets, but without any port designation

let appPathUrlBuildPublicPath; // will be constructed along the way and used in webpack.config.output.publicPath a.o.

// Definitions

appProtocolPrefix = appProps.useProtocolRelativeUrls ? '' : currTierProps.tls ? 'https:' : 'http:'; // protocol-relative is anti-pattern, but are sometimes handy
appFqdn = currTierProps.fqdn;
appPortNumber = currTierProps.port;
appPortWithSuffix = (appPortNumber) ? `:${appPortNumber}` : '';
appUrlPathAboveServerRoot = (devServerServeStatic) ? '' : currTierProps.appPathUrlAboveServerRoot;

appPathUrlBaseWithPort = `${appProtocolPrefix}//${appFqdn}${appPortWithSuffix}/${appUrlPathAboveServerRoot}`;
appPathUrlBaseNoPort = `${appProtocolPrefix}//${appFqdn}/${appUrlPathAboveServerRoot}`;

appPathUrlBuildWithPort = `${appPathUrlBaseWithPort}${appPathUrlBuildRelativeToApp}`;
appPathUrlBuildNoPort = `${appPathUrlBaseNoPort}${appPathUrlBuildRelativeToApp}`;

appPathUrlBuildPublicPath = appPathUrlBuildWithPort;

// ----------------
// Relative URL type based on env, or false if not relative
// Assumed values to be used: 'app-index-relative'; 'server-root-relative'; false (if not relative, but FQDN used)
// Value MUST be 'app-index-relative' if index.html is opened from local filesystem directly and CSS is not inlined in JS
let relativeUrlType = currTierProps.relativeUrlType;

if (devServerRunning) {
  console.log('\x1b[45m%s\x1b[0m', 'webpack-dev-server running, will force relativeUrlType to false');
  relativeUrlType = false;
}

if (!relativeUrlType && !appFqdn.trim()) {
  console.log('\x1b[101m%s\x1b[0m', 'When relativeUrlType is false, FQDN must be specified, aborting!');
  process.exit(1);
}

if (relativeUrlType === 'server-root-relative') {
  appPathUrlBuildPublicPath = `/${appUrlPathAboveServerRoot}${appPathUrlBuildRelativeToApp}`;
}
else if (relativeUrlType === 'app-index-relative') {
  appPathUrlBuildPublicPath = `${appPathUrlBuildRelativeToApp}`;
}
else {
  relativeUrlType = false; // sanitise
}

// ----------------
// MiniCssExtractPlugin publicPath
const miniCssExtractPublicPath = (development) ? appPathUrlBuildPublicPath : (relativeUrlType === 'app-index-relative') ? './' : appPathUrlBuildPublicPath;

// ----------------
// Source map type
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// Setup log
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'relativeUrlType', relativeUrlType);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToApp', appPathUrlBuildRelativeToApp);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToServerRoot', appPathUrlBuildRelativeToServerRoot);
if (development && devServerServeStatic) { console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'DEV SERVE STATIC', devServerServeStatic); }
if (!relativeUrlType) {
  console.log('\x1b[45m%s\x1b[0m', 'FQDN used, as relative URL is false.');
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBaseWithPort', appPathUrlBaseWithPort);
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBaseNoPort', appPathUrlBaseNoPort);
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildWithPort', appPathUrlBuildWithPort);
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildNoPort', appPathUrlBuildNoPort);
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildPublicPath', appPathUrlBuildPublicPath);
}
else {
  console.log('\x1b[45m%s\x1b[0m', 'Relative URL used, thus hostname, port a.o. does not apply.');
  console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildPublicPath', appPathUrlBuildPublicPath);
}
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ----------------
// BASE CONFIG
let config = {
  mode: development ? 'development' : 'production',
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    index: [
      'eligrey-classlist-js-polyfill',
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: appPathFsBuild,
    publicPath: appPathUrlBuildPublicPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src/'),
      'node_modules',
      'bower_components'
    ],
    alias: {
      extras: path.resolve(__dirname, 'src/helpers/')
    }
  }
};

// ----------------
// WEBPACK DEVSERVER CONFIG
config.devServer = {
  host: appFqdn,
  port: appPortNumber,

  hot: true,
  // hotOnly: true

  // pass content base if using webpack-dev-server to serve static files
  // contentBase: false,
  contentBase: (devServerServeStatic) ? appPathFsBase : false,
  // staticOptions: {},

  watchContentBase: false,
  // watchOptions: {
  //   poll: true
  // },
  // liveReload: true,

  publicPath: appPathUrlBuildPublicPath,

  // allow webpack DevServer to write files to disk
  // currently pass through only preflight files, that are copied using copy-webpack-plugin
  writeToDisk (filePath) {
    return filePath.match(/preflight\.(js|css)$/);
  },

  disableHostCheck: false,
  bonjour: false,
  clientLogLevel: 'info',
  compress: true,

  // lazy: true,
  // filename: 'index.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  allowedHosts: [
    '.test',
    'localhost'
  ],
  historyApiFallback: true,

  https: false,
  // https: {
  //   ca: fs.readFileSync(`${require('os').homedir()}/.valet/CA/LaravelValetCASelfSigned.pem`),
  //   key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${appFqdn}.key`),
  //   cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${appFqdn}.crt`)
  // },

  // pfx: '/path/to/file.pfx',
  // pfxPassphrase: 'passphrase',

  index: 'index.html',
  serveIndex: true,
  inline: true,
  noInfo: false,
  // open: false,
  // openPage: '/different/page',
  overlay: {
    warnings: false,
    errors: true
  },
  // proxy: {},
  // public: '',
  quiet: false,

  stats: 'normal',
  useLocalIp: false,

  before (app) {
    console.log('webpack DevServer middleware before');
  },
  after (app) {
    console.log('webpack DevServer middleware after');
  },
  onListening (server) {
    const port = server.listeningApp.address().port;
    console.log('webpack DevServer listening on port:', port);
  }
};

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.js$/,
      exclude: [/node_modules/, /bower_components/, /preflight\.js$/],
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: false,
          babelrc: true
        }
      }
    },
    {
      test: /\.(css)$/,
      use: [
        development
          ? {
            loader: 'style-loader',
            options: {}
          }
          : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: miniCssExtractPublicPath
            }
          },
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
            sourceMap: true,
            keepQuery: true
          }
        }
      ]
    },
    {
      test: /\.(scss)$/,
      use: [
        development
          ? {
            loader: 'style-loader',
            options: {}
          }
          : {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: miniCssExtractPublicPath
            }
          },
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
            sourceMap: true,
            keepQuery: true
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            prependData: `$env: ${tierName};`
          }
        }
      ]
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        },
        {
          loader: 'image-webpack-loader',
          options: {
            disable: development
          }
        }
      ]
    },
    {
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [
        {
          loader: 'file-loader',
          options: {}
        }
      ]
    }
  ]
};

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: !development, // can override
  minimizer: [
    new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      // include: '',
      // exclude: '',
      chunkFilter: (chunk) => { return true; },
      cache: true,
      cacheKeys: (defaultCacheKeys, file) => { return defaultCacheKeys; },
      parallel: true,
      sourceMap: !!sourceMapType,
      // minify: (file, sourceMap) => {},
      warningsFilter: (warning, source, file) => { return true; },
      extractComments: false,
      terserOptions: {
        // ecma: undefined,
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
    })
    // new OptimizeCSSAssetsPlugin({}) // Use while PostCSS is not introduced
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// Plugins as enabled OOB by webpack based on mode
// https://webpack.js.org/configuration/mode/
//
// development
// - NamedChunksPlugin
// - NamedModulesPlugin
//
// production
// - FlagDependencyUsagePlugin
// - FlagIncludedChunksPlugin
// - ModuleConcatenationPlugin
// - NoEmitOnErrorsPlugin
// - OccurrenceOrderPlugin
// - SideEffectsFlagPlugin
// - TerserPlugin
//
// none
// - none enabled

// ----------------
// DefinePlugin
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: (development) ? 'development' : 'production',
    BROWSER: true
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEVTOOLS__: development,
  __DEV__: development,
  __PROD__: !development,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production
}));

// ----------------
// Hot reloading
if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
}

// // ----------------
// // CopyPlugin
// config.plugins.push(new CopyPlugin([
//   {
//     from: path.join(__dirname, 'src/preflight/*.{js,css}'),
//     to: appPathFsBuild,
//     flatten: true,
//     toType: 'dir'
//   }
// ]));

// ----------------
// HtmlWebpackPlugin
config.plugins.push(new HtmlWebpackPlugin({
  // add user defined object to hold extra values to pass to template
  props: {
    appPathUrlBuildPublicPath,
    inlineContents: {
      'preflight.js': fs.readFileSync(path.resolve(__dirname, 'src/preflight/preflight.js'), 'utf8'),
      'preflight.css': fs.readFileSync(path.resolve(__dirname, 'src/preflight/preflight.css'), 'utf8')
    }
  },
  //
  title: `GUIDE - ${require(path.resolve(__dirname, 'package.json')).name}`,
  filename: path.join(__dirname, 'public/index.html'),
  template: path.resolve(__dirname, 'src/html/index.template.ejs'),
  // templateParameters: false,
  inject: false, // currently specify manually entry outputs in template
  // favicon: favicon.ico,
  // meta: {},
  // base: false,
  hash: false, // done at global level
  cache: true,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true, // HtmlWebpackHarddiskPlugin
  minify: (development)
    ? false
    : {
      minifyJS: true,
      minifyCSS: true,
      collapseInlineTagWhitespace: true,
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: false,
      removeStyleLinkTypeAttributes: false,
      useShortDoctype: true
    } // https://github.com/DanielRuf/html-minifier-terser#options-quick-reference
}));
// HtmlWebpackPlugin - HtmlWebpackHarddiskPlugin
config.plugins.push(new HtmlWebpackHarddiskPlugin());

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  chunkFilename: (development) ? '[id].css' : '[id].[chunkhash].css'
}));

// ----------------
// POSTCSS LOADER CONFIG
// defined in .postcssrc.js

// ----------------
// BROWSERSLIST CONFIG
// defined in .browserslistrc

// ----------------
// BABEL CONFIG
// defined in .babelrc

module.exports = config;
