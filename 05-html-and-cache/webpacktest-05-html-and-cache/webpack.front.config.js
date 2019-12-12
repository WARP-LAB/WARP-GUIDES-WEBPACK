'use strict';
const fs = require('fs');
const path = require('path');
const pConfig = require('./package.json');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
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

const devServe = !!process.env.DEV_SERVE;

// ----------------
// Output filesystem path
const outputPathFsContentBase = path.join(__dirname, 'public/');
const outputPathFsAssetsSuffix = 'assets/';
const outputPathFsBuild = path.join(__dirname, `public/${outputPathFsAssetsSuffix}`);

// ----------------
// Webpack output URL
const outputPathPublicUrlRelativeToApp = 'assets/'; // file system paths do not necessarily reflect in URL paths 
const outputPathPublicUrlAbsoluteToRoot = `/${pConfig.config.tiers[tierName].appPathAboveServerRoot}${outputPathPublicUrlRelativeToApp}`;

// ----------------
// Host, port, putput public path based on env
let targetAppProtocolPrefix; // protocol
let targetAppHostname; // hostname
let targetAppPathAboveServerRoot; // 'some/path/above/webroot/'
let targetAppPortSuffix; // if some custom port is specified, set suffix
let targetAppUrlWithPort; // app root URL (with custom port, if exists), usually domain root, but can be subpath
let targetAppUrlNoPort; // app root URL without any port designation

let outputPublicAssetsUrlWithPort; // ULR to built assets
let outputPublicAssetsUrlNoPort; // ULR to built assets, but without any port designation

// protocol-relative URLs are considered an anti-pattern in HTTPS-should-be-everywhere world
if (!pConfig.config.useProtocolRelativeUrls) {
  targetAppProtocolPrefix = pConfig.config.tiers[tierName].tls ? 'https:' : 'http:';
} else {
  targetAppProtocolPrefix = '';
}

targetAppHostname = (devServe) ? 'localhost' : pConfig.config.tiers[tierName].fqdn;
targetAppPathAboveServerRoot =  (devServe) ? '' : pConfig.config.tiers[tierName].appPathAboveServerRoot;
targetAppPortSuffix = (pConfig.config.tiers[tierName].port) ? `:${pConfig.config.tiers[tierName].port}` : '';
targetAppUrlWithPort = `${targetAppProtocolPrefix}//${targetAppHostname}${targetAppPortSuffix}/${targetAppPathAboveServerRoot}`;
targetAppUrlNoPort = `${targetAppProtocolPrefix}//${targetAppHostname}/${targetAppPathAboveServerRoot}`;
outputPublicAssetsUrlWithPort = `${targetAppUrlWithPort}${outputPathPublicUrlRelativeToApp}`;
outputPublicAssetsUrlNoPort = `${targetAppUrlNoPort}${outputPathPublicUrlRelativeToApp}`;

let relativeUrlType;
let webpackConfigOutputPublicPath = outputPublicAssetsUrlWithPort;

if (devServe) {
  // if using webpack-dev-server to serve files, just use full url
  relativeUrlType = false;
}
else {
  relativeUrlType = pConfig.config.tiers[tierName].relativeUrlType;
  if (relativeUrlType === 'server-root-relative') {
    webpackConfigOutputPublicPath = `/${targetAppPathAboveServerRoot}${outputPathPublicUrlRelativeToApp}`;
  }
  else if (relativeUrlType === 'app-index-relative') {
    webpackConfigOutputPublicPath = `${outputPathPublicUrlRelativeToApp}`;
  }
  else {
    relativeUrlType = false; // sanitize
  }
}

console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
if (devServe) { console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'DEV SERVE', devServe); }
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppHostname', targetAppHostname);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppUrlWithPort', targetAppUrlWithPort);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppUrlNoPort', targetAppUrlNoPort);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'outputPublicAssetsUrlWithPort', outputPublicAssetsUrlWithPort);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'outputPublicAssetsUrlNoPort', outputPublicAssetsUrlNoPort);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

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
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPathFsBuild,
    publicPath: webpackConfigOutputPublicPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
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

  contentBase: (devServe) ? outputPathFsContentBase : false,
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
  host: targetAppHostname,

  // needs webpack.HotModuleReplacementPlugin()
  hot: pConfig.config.webpackDevServer.hot,
  // hotOnly: true

  https: development && pConfig.config.tiers.development.tls
    ? {
      ca: fs.readFileSync(`${require('os').homedir()}/.valet/CA/LaravelValetCASelfSigned.pem`),
      key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.key`),
      cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.crt`)
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
  publicPath: outputPublicAssetsUrlWithPort,
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
      test: /\.(css)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
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
      ],
    },
    {
      test: /\.(scss)$/,
      use: [
        development ? 'style-loader' : MiniCssExtractPlugin.loader,
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
            prependData: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
          }
        }
      ],
    },
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
          }
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
      test: /\.(woff2|woff|otf|ttf|eot|svg)$/,
      use: [{
        loader: 'file-loader',
        options: {
          publicPath: (relativeUrlType === 'app-index-relative') ? './' : ''
        }
      }]
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
      // chunkFilter: (chunk) => {
      //   return true;
      // },
      cache: true,
      // cacheKeys: (defaultCacheKeys, file) => {},
      parallel: true,
      sourceMap: !!sourceMapType,
      // minify: (file, sourceMap) => {},
      // warningsFilter: (warning, source, file) => {
      //   return true;
      // },
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
      cssProcessorOptions: {
        map: sourceMapType === false ? false :
        sourceMapType.includes('inline') ?
        {
          inline: true,
        } :
        {
          inline: false,
          annotation: true
        }
      }
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
  // config.plugins.push(new webpack.NamedModulesPlugin()); // enabled in development mode by default https://webpack.js.org/configuration/mode/
} else {
  // config.plugins.push(new webpack.HashedModuleIdsPlugin());
  // config.plugins.push(new webpack.NamedModulesPlugin());
}

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
      // {
      //   source: path.join(__dirname, 'src/preflight/*.{js,css}'),
      //   destination: outputPathFsBuild
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
  // just pass through some variables
  outputPublicAssetsUrlNoPort,
  outputPublicAssetsUrlWithPort,
  fsInlineContents: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
  //
  title: `GUIDE - ${pConfig.name}`,
  filename: `${outputPathFsContentBase}index.html`,
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
  chunkFilename: (development) ? '[id].css' : '[id].[chunkhash].css',
}));

// ----------------
// POSTCSS LOADER CONFIG
// defined in .postcssrc.js

// ----------------
// BROWSERSLIST CONFIG
// defined in .browserslistrc

module.exports = config;