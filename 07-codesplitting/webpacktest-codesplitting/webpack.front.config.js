'use strict';
const path = require('path');
const fs = require('fs');
const pConfig = require('./package.json');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin'); // aliasing this back to webpack.optimize.UglifyJsPluginis is scheduled for webpack v4.0.0
const FileManagerPlugin = require('filemanager-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const StyleLintPlugin = require('stylelint-webpack-plugin'); // eslint-disable-line no-unused-vars
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin'); // eslint-disable-line no-unused-vars
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin'); // eslint-disable-line no-unused-vars
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Host, port, putput public path based on env
let targetHost;
let outputPublicPath;
const protocolPrefix = pConfig.config.isWebpackDevServerHTTPS ? 'https:' : 'http:';
const devServerPortNumber = pConfig.config.isWebpackDevServerHTTPS ? pConfig.config.portFrontendWebpackDevServerHTTPS : pConfig.config.portFrontendWebpackDevServerHTTP;

if (production) {
  outputPublicPath = `//${pConfig.config.hostProduction}${pConfig.config.pathAboveRootProduction}/assets/`;
  targetHost = pConfig.config.hostProduction;
} else if (staging) {
  outputPublicPath = `//${pConfig.config.hostStaging}${pConfig.config.pathAboveRootStaging}/assets/`;
  targetHost = pConfig.config.hostStaging;
} else if (testing) {
  outputPublicPath = `//${pConfig.config.hostTesting}${pConfig.config.pathAboveRootTesting}/assets/`;
  targetHost = pConfig.config.hostTesting;
} else {
  outputPublicPath = `${protocolPrefix}//${pConfig.config.hostDevelopment}:${devServerPortNumber}${pConfig.config.pathAboveRootDevelopment}/assets/`;
  targetHost = pConfig.config.hostDevelopment;
}

console.log('targetHost \x1b[36m%s\x1b[0m', targetHost);
console.log('outputPublicPath \x1b[36m%s\x1b[0m', outputPublicPath);
console.log('devServerPortNumber \x1b[36m%s\x1b[0m', devServerPortNumber);

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

// ----------------
// Source map conf
const sourceMapType = (development) ? 'inline-source-map' : false;

// ----------------
// BASE CONFIG

let config = {
  devtool: sourceMapType,
  context: __dirname,
  entry: {
    vendor: [
      'classlist-polyfill',
      'lodash'
    ],
    index: [
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      path.join(__dirname, 'src/section.js')
    ]
  },
  output: {
    path: outputPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
    publicPath: outputPublicPath
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
// webpack DevServer

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
  // filename: 'site.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  historyApiFallback: true,
  host: targetHost,

  // needs webpack.HotModuleReplacementPlugin()
  hot: pConfig.config.isWebpackDevServerHot,
  // hotOnly: true

  https: pConfig.config.isWebpackDevServerHTTPS
    ? {
      // ca: fs.readFileSync('/path/to/ca.pem'),
      // key: fs.readFileSync('/path/to/server.key'),
      // cert: fs.readFileSync('/path/to/server.crt')
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
  port: devServerPortNumber,
  // proxy: {},
  // public: 'myapp.test:80',
  publicPath: outputPublicPath,
  quiet: false,
  // socket: 'socket',
  // staticOptions: {},
  stats: 'normal',
  useLocalIp: false,

  before (app) {
    console.log('Webpack devserver middlewres before');
  },
  after (app) {
    console.log('Webpack devserver middlewres after');
  }
};

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      enforce: 'pre',
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      loader: 'eslint-loader',
      options: {
        emitError: true,
        emitWarning: true,
        failOnWarning: !development,
        failOnError: !development,
        quiet: true,
        outputReport: false
      }
    },
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
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
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
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        (production)
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
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff2'
        }
      }]
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff'
        }
      }]
    },
    {
      test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-opentype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-truetype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/vnd.ms-fontobject'
        }
      }]
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'mimetype=image/svg+xml'
        }
      }]
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
  __DEVTOOLS__: development,
  __PORT_FRONT_APP_HTTP__: pConfig.config.portFrontendAppHTTP, // JSON.stringify
  __PORT_FRONT_APP_HTTPS__: pConfig.config.portFrontendAppHTTPS
}));

// ----------------
// Hot reloading and named modules

if (development && pConfig.config.isWebpackDevServerHot) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
} else {
  config.plugins.push(new webpack.HashedModuleIdsPlugin());
}

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
    sourceMap: sourceMapType // evaluates to bool
  }));
}

// ----------------
// FileManagerPlugin

config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      // {
      //   source: path.join(__dirname, 'src/preflight/*.{js,css}'),
      //   destination: outputPath
      // }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// Code splitting

// NamedChunksPlugin
config.plugins.push(new webpack.NamedChunksPlugin());

// CommonsChunkPlugin

// // -----
// // Approach 1. One seperate output for all shared code
//
// // Shared block
// config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
//   name: [
//     'shared'
//   ],
//   minChunks: 2
// }));

// // -----
// // Approach 2. Explicit vendor chunk
//
// // Vendor block
// config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
//   name: [
//     'vendor'
//   ],
//   minChunks: Infinity
// }));

// // -----
// // Approach 3. Explicit vendor chunk and separate shared chunk
//
// // Shared block
// config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
//   name: [
//     'shared'
//   ],
//   minChunks: 2,
//   chunks: [
//     'index',
//     'section'
//   ]
// }));
//
// // Vendor block
// config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
//   name: [
//     'vendor'
//   ],
//   minChunks: Infinity
// }));

// -----
// Approach 4. Runtime

// Shared block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'shared'
  ],
  minChunks: 2,
  chunks: [
    'index',
    'section'
  ]
}));

// Vendor block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'vendor'
  ],
  minChunks: Infinity
}));

// Runtime block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'runtime'
  ]
}));

// ----------------
// HtmlWebpackPlugin

config.plugins.push(new HtmlWebpackPlugin({
  title: `GUIDE - ${pConfig.name}`,
  filename: path.join(__dirname, 'public/index.html'),
  template: path.join(__dirname, 'src/html/index.template.ejs'),
  inject: 'body',
  // favicon: favicon.ico,
  hash: false,
  cache: true,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true,
  fsInlineContents: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
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
// ExtractTextPlugin

config.plugins.push(new ExtractTextPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  disable: development, // disable when development
  allChunks: true
}));

// ----------------
// ScriptExtHtmlWebpackPlugin

config.plugins.push(new ScriptExtHtmlWebpackPlugin({
  inline: (development) ? [] : [
    /runtime.*.js$/
  ]
  // preload: /\.js$/,
  // defaultAttribute: 'async'
}));

// ----------------
// ScriptExtHtmlWebpackPlugin

config.plugins.push(new StyleExtHtmlWebpackPlugin({
  cssRegExp: /.css$/,
  position: 'plugin',
  minify: false,
  enabled: false // disable it or set !development
}));

// ----------------
// StyleLint CONFIG

config.plugins.push(new StyleLintPlugin({
  configFile: '.stylelintrc.js',
  emitErrors: false,
  failOnError: false,
  files: ['**/*.s?(a|c)ss'],
  lintDirtyModulesOnly: false,
  syntax: 'scss',
  quiet: false
}));

// ----------------
// BundleAnalyzerPlugin

if (production) {
  config.plugins.push(new BundleAnalyzerPlugin());
}

// ----------------
// POSTCSS LOADER CONFIG
// ALWAYS

// defined in .postcssrc.js

// ----------------
// BROWSERSLIST CONFIG
// ALWAYS

// defined in .browserslistrc

// ----------------
// BABEL CONFIG

// defined in .babelrc

// ----------------
// ESLINT CONFIG

// defined in .eslintrc.js

// ----------------
// STYLELINT CONFIG

// defined in .stylelintrc.js

module.exports = config;
