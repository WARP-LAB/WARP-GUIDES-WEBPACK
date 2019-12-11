# webpack DevServer and hot reloading

---
# In this section
---

* Custom `properties.json` (helper) file
* webpack DevServer setup
* CORS
* making it hot

---
# Prefligt
---

Use existing code base from previous guide stage (`webpacktest-02-css-and-files`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-03-devserver`.  
Make changes in `package.json` name field.  
Dont forget `npm install`.

```sh
cd webpacktest-03-devserver
npm install
```

---
# User defined `properties.json` file
---

This might be a good time to create an extra file, which holds properties/data that can be used in webpack config script.

_properties.json_

```json
{
  "useProtocolRelativeUrls": false,
  "webpackDevServer": {
    "hot": true
  },
  "tiers": {
    "development": {
      "fqdn": "localhost",
      "tls": false,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": "app-index-relative"
    },
    "testing": {
      "fqdn": "",
      "tls": false,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": "app-index-relative"
    },
    "staging": {
      "fqdn": "webpacktest-03-devserver.test",
      "tls": false,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "production": {
      "fqdn": "webpacktest-03-devserver.test",
      "tls": true,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    }
  }
}
```

Alternative would be to store this configuration within `package.json` under some user defined key.

---
# webpack DevServer
---

## Install

### Webpack webpack-dev-server

Documentation  
[webpack-dev-server](https://github.com/webpack/webpack-dev-server)

```sh
npm install webpack-dev-server --save-dev
```

## Basic setup

Till now webpages could be loaded by simply opening `public/index.html` in browser from local filesystem (or using `test` TLDs if you are using Valet). 

When `webpack-dev-server` is run it spawns Node.js server on the local machine that serves built assets that are piped through loaders.  
Currently built assets are JS, CSS, image files and webfont files.  
`webpack-dev-server` can also be set up to serve static files if asked to. For example `public/index.html` and other assets in `public/assets/` that are not piped through loaders, for example `preflight.(js|css)`.

### Development tier

From now on development tier will be run using *webpack-dev-server*.

There is still possibility to build for two *types of developments* though, one being as up until this chapter and other being *webpack-dev-server* based.

### Running webpack-dev-server on `localhost`

#### Configure variables that will be used to set up the DevServer

They will make sense once they are used.

*webpack.front.config.js*

```javascript
// ...

const appProps = require('./properties.json');

// ...

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
const appPathUrlBuildRelativeToServerRoot = `/${currTierProps.appPathUrlAboveServerRoot}${appPathUrlBuildRelativeToApp}`; // URL path for appPathFsBuild, relative to webserver root

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
// Assumed values to be used:
//    'app-index-relative'
//    'server-root-relative'
//    false (if not relative, but FQDN used)
// Note that value MUST be 'app-index-relative' if index.html is opened from local filesystem directly
// let relativeUrlType = (devServerRunning) ? false : currTierProps.relativeUrlType;
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
  appPathUrlBuildPublicPath = `/${appPathAboveServerRoot}${appPathUrlBuildRelativeToApp}`;
}
else if (relativeUrlType === 'app-index-relative') {
  appPathUrlBuildPublicPath = `${appPathUrlBuildRelativeToApp}`;
}
else {
  relativeUrlType = false; // sanitise
}

// ----------------
// file-loader publicPath
const fileLoaderPublicPath = (development) ? '' : (relativeUrlType === 'app-index-relative') ? './' : '';

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
    path: appPathFsBuild,
    publicPath: appPathUrlBuildPublicPath,
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

// ...

```

#### HTML

Manually (for now) change your HTML.

Prefligt JS and CSS files are copied no matter what to assets directory, so we can still use relative paths for those.

But for all things that webpack is *building* set absolute path that reflects development tier as set in *properties.json*.

*index.html*

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="description" content="Webpack Guide">
  <meta name="keywords" content="webpack,guide">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <script src="assets/preflight.js"></script>
  <link href="assets/preflight.css" rel="stylesheet" type="text/css">
  <!-- <link href="assets/index.css" rel="stylesheet" type="text/css"> -->
  <link href="http://localhost:4000/assets/index.css" rel="stylesheet" type="text/css">
</head>
<body>
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  <div class="app"> Loading... </div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <!-- <script src="assets/index.js"></script> -->
  <script src="http://localhost:4000/assets/index.js"></script>
</body>
</html>
```

#### Run DevServer, `index.html` from local filesytem

Run DevServer

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack-dev-server --config=$(pwd)/webpack.front.config.js \
--host=localhost --port=4000 --history-api-fallback -d --inline
```

Open `public/index.html` in browser as until now (unless you have gone Valet route) in your browser.

Page opens and we have two issues.
First one is that webfonts are not loaded and console spits `Access to font (..) has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`.
Second is that prefligt js and css is not loaded and they are not in assets directory.

Let us fix that.

#### CORS policy webpack-dev-server configuration 

Webfonts are not loaded when opening `index.html` file localy as they are served via `http://localhost:4000/'

Let us move webpack-dev-server configuration from command line inline options to an object within `webpack.front.confg.js`.

[Configuration options](https://webpack.js.org/configuration/dev-server/#devserver) are quite extensive, let us fill in some.

*webpack.front.config.js*

```javascript
// ...

// ----------------
// WEBPACK-DEV-SERVER CONFIG
config.devServer = {
  host: appFqdn,
  port: appPortNumber,

  // needs webpack.HotModuleReplacementPlugin()
  hot: false,
  // hotOnly: true

  // pass content base if using webpack-dev-server to serve static files
  contentBase: false,
  // contentBase: path.join(__dirname, 'public/'),
  // staticOptions: {},

  watchContentBase: false,
  // watchOptions: {
  //   poll: true
  // },
  // liveReload: true,

  publicPath: appUrlBuildPublicPath,

  // allow webpack-dev-server to write files to disk
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

// ...
```

Kill previous DevServer instance (`ctr+c`). Rerun it (now without all those command line arguments) and observe.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Fonts are loading because `Access-Control-Allow-Origin` is set.
And `preflight` files are copied over to assets, because `writeToDisk` is set. Only allowing preflight files *through* for now.

At this point task of being able to run DevServer and to open `index.html` from local filesytem that renders content correctly should be solved.

* JavaScript file is served by `webpack-dev-server`
* CSS content (embedded in JavaScript file) is served by `webpack-dev-server`
* assets that are piped through loaders (in this case images and webfonts) is served by `webpack-dev-server` 
* `preflight.(js|css)` are outputted to local filesystem, html references them relatively
* `index.html` is opened directly from local filesystem

#### Run DevServer, `index.html` and static files served by webpack-dev-server

Static files that are not generated assets, which currently in our case are `public/index.html` as well as `public/assets/preflight.(js|css)` can be served by webpack-dev-server (and that might be the correct apprach as then we can use FQDNs and set `relativeUrlType` to false).

First we need to set *content base* for `devServer` config.

*webpack.front.config.js*

```javascript
// ...

// ----------------
// WEBPACK DEVSERVER CONFIG
config.devServer = {

  // ...

  contentBase: (devServerServeStatic) ? appPathFsBase : false,
  
  // ...
};

// ...  

```

Secondly we can change *properties.json* that is consumed by webpack config script and set `relativeUrlType` to false. It can be skipped due to the fact that webpack config script checks if DevServer is running and if yes, forces relativeUrlType to false automatically, thus setting everything to use FQDN.

*properties.json*

```javascript
    "development": {
      "fqdn": "localhost",
      "tls": false,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    }
```

We introduced new self-declared ENV variable `DEV_SERVE_STATIC` (it could be any other name). It lets us pass command line option whether *webpack-dev-server* should serve static files - it is uded to set `devServerServeStatic` flag.

Run DevServer

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
DEV_SERVE_STATIC=true \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Fire up [http://localhost:4000/](http://localhost:4000/) in the browser. 

* JavaScript file is served by `webpack-dev-server`
* CSS content (embedded in JavaScript file) is served by `webpack-dev-server`
* assets that are piped through loaders (in this case images and webfonts) is served by `webpack-dev-server` 
* `preflight.(js|css)` are outputted to filesystem, and are served by `webpack-dev-server` 
* `index.html` is served by `webpack-dev-server`

Note that as all static assets are served by *webpack-dev-server* we could also set absolute paths for prefligt resources in `index.html`.

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="description" content="Webpack Guide">
  <meta name="keywords" content="webpack,guide">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <!-- <script src="assets/preflight.js"></script> -->
  <script src="http://localhost:4000/assets/preflight.js"></script>
  <!-- <link href="assets/preflight.css" rel="stylesheet" type="text/css"> -->
  <link href="http://localhost:4000/assets/preflight.css" rel="stylesheet" type="text/css">
  <!-- <link href="assets/index.css" rel="stylesheet" type="text/css"> -->
  <link href="http://localhost:4000/assets/index.css" rel="stylesheet" type="text/css">
</head>
<body>
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  <div class="app"> Loading... </div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <!-- <script src="assets/index.js"></script> -->
  <script src="http://localhost:4000/assets/index.js"></script>
</body>
</html>
```

#### Run DevServer, `index.html` served by nginx

Assuming you are working on this locally via `test` TLD using nginx as described in *Hello World* then everything should also be accessible via [http://webpacktest-03-devserver.test/](http://webpacktest-03-devserver.test) and there is no need for *webpack-dev-server* to serve static files.

There is even no need to set FQDN in *properties.json*, as `Access-Control-Allow-Origin` is set to `*`.

If the *correct* way is chosen then change props

*properties.json*

```javascript
    "development": {
      "fqdn": "webpacktest-03-devserver.test",
      "tls": false,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
```

And change FQDN also in `index.html` accordingly.

*index.html*

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="description" content="Webpack Guide">
  <meta name="keywords" content="webpack,guide">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <!-- <script src="assets/preflight.js"></script> -->
  <script src="http://webpacktest-03-devserver.test:4000/assets/preflight.js"></script>
  <!-- <link href="assets/preflight.css" rel="stylesheet" type="text/css"> -->
  <link href="http://webpacktest-03-devserver.test:4000/assets/preflight.css" rel="stylesheet" type="text/css">
  <!-- <link href="assets/index.css" rel="stylesheet" type="text/css"> -->
  <link href="http://webpacktest-03-devserver.test:4000/assets/index.css" rel="stylesheet" type="text/css">
</head>
<body>
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  <div class="app"> Loading... </div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <!-- <script src="assets/index.js"></script> -->
  <script src="http://webpacktest-03-devserver.test:4000/assets/index.js"></script>
</body>
</html>
```

Run DevServer without static file serving

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Open [http://webpacktest-03-devserver.test/](http://webpacktest-03-devserver.test/). It also should work by opening `public/index.html` file from file system (as CORS is set).

## npm scripting the additional build options

*package.json*

```json
  "scripts": {
    "front:devserver:serve": "npm run clean:assets && NODE_ENV=development webpack-dev-server --config=$(pwd)/webpack.front.config.js -d",
    "front:devserver:static": "npm run clean:assets && NODE_ENV=development DEV_SERVE_STATIC=true webpack-dev-server --config=$(pwd)/webpack.front.config.js -d",
    "front:build:dev": "npm run clean:assets && NODE_ENV=development webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:test": "npm run clean:assets && NODE_ENV=testing webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:stage": "npm run clean:assets && NODE_ENV=staging webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:prod": "npm run clean:assets && NODE_ENV=production webpack --config=$(pwd)/webpack.front.config.js --progress",
    "clean:assets": "rm -rf $(pwd)/public/assets/**"
  }
```

## Setting up hot reloading

Rerun DevServer. Whatever approach, assuming using `localhost` with `DEV_SERVE_STATIC=true`.

```sh
npm run front:devserver:static
```

Refresh webpage [http://localhost:4000/](http://localhost:4000/)

Enter something in text input field (the one that has placeholder *Text Here*) using browser.

Without stopping DevServer change something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(150px);
```

and save file.

Webpage is automatically refreshed showing the change in SCSS, which is nice. However, the text you entered in input field is lost as the page got refreshed. Or if put otherwise, *you lost state* which is very inconvenient (especially once you'll get to frontend frameworks that are stateful).

We can do better!

Enable hot reloading in development

```javascript
// ...

config.devServer = {
  // ...
  hot: true,
  // ...
};

// ...

// ----------------
// Hot reloading
if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  // NamedModulesPlugin and NamedChunksPlugin enabled in development mode by default https://webpack.js.org/configuration/mode/
}

```

## Test hot reloading

Kill previous instance. Rerun DevServer. Refresh webpage.

Enter something in input field (the one that has placeholder *Text Here*) using browser.

Make changes again in SCSS

_src/index.global.scss_

```scss
  transform: translateY(70px);
```

and save file.

Now the page applies the changed SCSS without refreshing, but *hot reloading*. The text you entered in input field is still there as *state* is kept.

Now kill `ctrl+c` DevServer.

## Disabling MiniCssExtractPlugin for hot reloading CSS

This is just a note as we have it already going in _webpack.config.js_ where *style-loader* is used instead of *MiniCssExtractPlugin* when on development. When running DevServer we want CSS to be inlined within JavaScript so that hot reloading works. Sure, it will result in `404` for `assets/index.css` and FOUCs, but it is ok for rapid development.

## Changing HTML based on environment / mode

What happens if building for testing tier now?

```sh
npm run front:build:test
```

Well, things break. One has to manually change `index.html` file and change paths from `http://localhost:4000/assets/file.ext` to `assets/file.ext` as there is no DevServer at localhost. This is inconvenient. How about building *HTML* so that it automatically sets source path URls based on *properties.json* and build target tier?

---
# Next
---

Dynamic HTML building will cover how HTML building could be automated.
