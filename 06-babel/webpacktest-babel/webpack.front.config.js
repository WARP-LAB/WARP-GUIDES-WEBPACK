'use strict';
const fs = require('fs');
const path = require('path');
const pConfig = require('./package.json');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// ----------------
// ENV
// bit manual mangling as we cannot trust process.env.NODE_ENV to be set
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
// Host, port, putput public path based on env
let targetAppProtocolPrefix = ''; // explicitly set protocol, protocol-relative URLs are now considered an anti-pattern
let targetAppHost; // hostname
let targetAppPortSuffix; // if some custom port is specified, set suffix
let targetAppUrlFull; // app root URL (with custom port, if exists), usually domain root, but can be subdirectory
let targetAppUrlNoPort; // app root URL without any port designation
const targetAppBuildUrlDir = 'assets/';

let outputPublicPathBuilt; // ULR to built assets
let outputPublicPathNoPort; // ULR to built assets, but without any port designation

// we can use tierName to set stuff at once
if (!pConfig.config.useProtocolRelativeUrls) {
  targetAppProtocolPrefix = pConfig.config.tiers[tierName].tls ? 'https:' : 'http:';
}
targetAppHost = pConfig.config.tiers[tierName].host;
targetAppPortSuffix = (pConfig.config.tiers[tierName].port) ? `:${pConfig.config.tiers[tierName].port}` : '';
targetAppUrlFull = `${targetAppProtocolPrefix}//${pConfig.config.tiers[tierName].sub}${pConfig.config.tiers[tierName].host}${targetAppPortSuffix}/${pConfig.config.tiers[tierName].appPathAboveRoot}`;
targetAppUrlNoPort = `${targetAppProtocolPrefix}//${pConfig.config.tiers[tierName].sub}${pConfig.config.tiers[tierName].host}/${pConfig.config.tiers[tierName].appPathAboveRoot}`;
outputPublicPathBuilt = `${targetAppUrlFull}${targetAppBuildUrlDir}`;
outputPublicPathNoPort = `${targetAppUrlNoPort}${targetAppBuildUrlDir}`;

console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppHost', targetAppHost);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppUrlFull', targetAppUrlFull);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'outputPublicPathBuilt', outputPublicPathBuilt);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'outputPublicPathNoPort', outputPublicPathNoPort);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ----------------
// Output fs path
const outputFsPath = path.join(__dirname, 'public/assets');

// ----------------
// Source map conf
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// BASE CONFIG

let config = {
  mode: development ? 'development' : 'production',
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    index: [
      'classlist-polyfill',
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputFsPath,
    publicPath: outputPublicPathBuilt,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js'
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
// DevServer CONFIG

config.devServer = {
  allowedHosts: [
    '.test',
    'localhost'
  ],
  disableHostCheck: false,
  bonjour: false,
  clientLogLevel: 'info',
  compress: true,

  contentBase: false, // path.join(__dirname, 'public'), // pass content base if not using nginx to serve files
  // watchContentBase: true,
  // watchOptions: {
  //   poll: true
  // },

  // lazy: true,
  // filename: 'index.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  historyApiFallback: true,
  host: targetAppHost,

  // needs webpack.HotModuleReplacementPlugin()
  hot: pConfig.config.webpackDevServer.hot,
  // hotOnly: true

  https: development && pConfig.config.tiers.development.tls
    ? {
      ca: fs.readFileSync(`${require('os').homedir()}/.valet/CA/LaravelValetCASelfSigned.pem`),
      key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHost}.key`),
      cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHost}.crt`)
    }
    : false,
  // pfx: '/path/to/file.pfx',
  // pfxPassphrase: 'passphrase',

  index: 'index.htm',
  inline: true,
  noInfo: false,
  open: false,
  // openPage: '/different/page',
  overlay: {
    warnings: false,
    errors: true
  },
  port: pConfig.config.tiers.development.port,
  // proxy: {},
  // public: 'myapp.test:80',
  publicPath: outputPublicPathBuilt,
  quiet: false,
  // socket: 'socket',
  // staticOptions: {},
  stats: 'normal',
  useLocalIp: false,

  before (app) {
    console.log('Webpack devserver middleware before');
  },
  after (app) {
    console.log('Webpack devserver middleware after');
  }
};

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      use: {
        loader: 'babel-loader',
        options: {
          babelrc: true,
          cacheDirectory: false
        }
      }
    },
    {
      test: /\.(css)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            minimize: false,
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
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            minimize: false,
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
            data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
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
        (!development)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    },
    {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    },
    {
      test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'file-loader',
        options: {}
      }]
    }
  ]
};

// ----------------
// OPTIMISATION

config.optimization = {
  // minimize: false, // can override
  minimizer: [
    new UglifyJsPlugin({
      cache: true,
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
          warnings: true
        },
        ecma: 6,
        mangle: false,
        warnings: true,
        output: {
          comments: false,
          beautify: false
        }
      },
      extractComments: false,
      sourceMap: !!sourceMapType // evaluates to bool
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
// Hot reloading and named modules

if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  // config.plugins.push(new webpack.NamedModulesPlugin()); // enabled by mode
} else {
  // config.plugins.push(new webpack.HashedModuleIdsPlugin());
  // config.plugins.push(new webpack.NamedModulesPlugin());
}

// ----------------
// ModuleConcatenationPlugin
config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

// ----------------
// FileManagerPlugin
config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      // {
      //   source: path.join(__dirname, 'src/preflight/*.{js,css}'),
      //   destination: outputFsPath
      // }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// HtmlWebpackPlugin
config.plugins.push(new HtmlWebpackPlugin({
  outputPublicPathNoPort,
  fsInlineContents: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
  title: `GUIDE - ${pConfig.name}`,
  filename: path.join(__dirname, 'public/index.html'),
  template: path.join(__dirname, 'src/html/index.template.ejs'),
  inject: false, // we specify manually where we want our entry outputs to be in the template
  // favicon: favicon.ico,
  hash: false,
  cache: true,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true,
  minify: (development)
    ? false
    : {
      minifyJS: true,
      minifyCSS: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true
    } // https://github.com/kangax/html-minifier#options-quick-reference
}));
// HtmlWebpackHarddiskPlugin
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
