'use strict';
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

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

const devServeStatic = !!process.env.DEV_SERVE_STATIC && process.env.DEV_SERVE_STATIC === 'true';

// ----------------
// Output filesystem path
const outputPathFsContentBase = path.join(__dirname, 'public/');
const outputPathFsAssetsSuffix = 'assets/';
const outputPathFsBuild = path.join(__dirname, `public/${outputPathFsAssetsSuffix}`);

// ----------------
// Output public path
const outputPathPublicUrlRelativeToApp = 'assets/';

// ----------------
// Host, port, output public path based on env
let targetAppHostname;
let targetAppPortNumber;
let outputPublicAssetsUrlFinal;

targetAppHostname = 'localhost'; // 'webpacktest-devserver.test';
targetAppPortNumber = 4000;
outputPublicAssetsUrlFinal = development ? `http://${targetAppHostname}:${targetAppPortNumber}/${outputPathPublicUrlRelativeToApp}` : outputPathPublicUrlRelativeToApp;
const webpackConfigOutputPublicPath = outputPublicAssetsUrlFinal;

let relativeUrlType; // possible values: false, 'app-index-relative', 'server-root-relative'
if (development) {
  relativeUrlType = false;
}
else {
  relativeUrlType = 'app-index-relative';
}

// ----------------
// Print constructed settings
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'targetAppHostname', targetAppHostname);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'outputPublicAssetsUrlFinal', outputPublicAssetsUrlFinal);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'relativeUrlType', relativeUrlType);
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
// DevServer CONFIG
config.devServer = {
  host: targetAppHostname,
  port: targetAppPortNumber,

  // needs webpack.HotModuleReplacementPlugin()
  hot: true,
  // hotOnly: true

  // pass content base if using webpack-dev-server to serve static files
  // contentBase: false,
  contentBase: (devServeStatic) ? outputPathFsContentBase : false,
  // staticOptions: {},

  watchContentBase: false,
  // watchOptions: {
  //   poll: true
  // },
  // liveReload: true,

  publicPath: outputPublicAssetsUrlFinal,

  // allow webpack-dev-server to write files to disk
  // pass through only preflight files, that are copied using copy-webpack-plugin
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
  //   key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.key`),
  //   cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.crt`)
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
    console.log('Webpack devserver middleware before');
  },
  after (app) {
    console.log('Webpack devserver middleware after');
  },
  onListening (server) {
    const port = server.listeningApp.address().port;
    console.log('Webpack devserver listening on port:', port);
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
      ]
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
      ]
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
        map: (sourceMapType === false) ? false :
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
// Hot reloading
if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  // config.plugins.push(new webpack.NamedModulesPlugin()); // enabled in development mode by default https://webpack.js.org/configuration/mode/
}

// ----------------
// ModuleConcatenationPlugin
if (!development) {
  // config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin()); // enabled in production mode by default https://webpack.js.org/configuration/mode/
}

// ----------------
// CopyPlugin
config.plugins.push(new CopyPlugin([
  {
    from: path.join(__dirname, 'src/preflight/*.{js,css}'),
    to: outputPathFsBuild,
    flatten: true,
    toType: 'dir'
  }
]));

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: '[name].css',
  chunkFilename: '[id].css',
}));

module.exports = config;