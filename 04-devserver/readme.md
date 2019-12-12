# webpack DevServer and hot reloading

---
# In this section
---

* Custom `properties.json` (helper) file
* webpack DevServer setup
* CORS
* making it hot

---
# Preflight
---

Use existing code base from previous guide stage (`webpacktest-03-file-loading`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-04-devserver`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`.

```sh
cd webpacktest-04-devserver
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
      "fqdn": "webpacktest-04-devserver.test",
      "tls": false,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "production": {
      "fqdn": "webpacktest-04-devserver.test",
      "tls": true,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    }
  }
}
```

Alternative would be to store this configuration within `package.json` under some user defined key or embed within *webpack.front.config.js*.

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

There is still possibility to build for *previous type of development* though - the one as up until this chapter.

### Running webpack-dev-server on `localhost`

#### Configure variables that will be used to set up the DevServer

They will make sense once they are used.

_webpack.front.config.js_

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
  appPathUrlBuildPublicPath = `/${appPathAboveServerRoot}${appPathUrlBuildRelativeToApp}`;
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

// ...

```

#### HTML

Manually (for now) change the HTML.

Preflight JS and CSS files are copied no matter what to assets directory, so relative paths still can be used for those.

But for all things that webpack is *compiling* absolute path is set that reflects development tier as set in *properties.json*.

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

Open `public/index.html` directly from local filesystem in browser as up until now (unless you have gone Valet route) in your browser.

Page opens and we have two issues.

* First one is that webfonts are not loaded and console spits `Access to font (..) has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`.
* Second is that `prefligt.(js|css)` are not output in assets directory and thus are not loaded (browsser console yields 404's).


#### CORS policy webpack-dev-server configuration 

Webfonts are not loaded when opening `index.html` file locally as they are served via `http://localhost:4000/' by webpack DevServer.

To fix that move webpack-dev-server configuration from command line inline options to an object within `webpack.front.confg.js`.

[Configuration options](https://webpack.js.org/configuration/dev-server/#devserver) are quite extensive, let us fill in some.

*webpack.front.config.js*

```javascript
// ...

// ----------------
// WEBPACK DEVSERVER CONFIG
config.devServer = {
  host: appFqdn,
  port: appPortNumber,

  hot: false,
  // hotOnly: true

  // pass content base if using webpack-dev-server to serve static files
  contentBase: false,
  // contentBase: path.resolve(__dirname, 'public/'),
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

// ...
```

Previous DevServer instance should be killed (`ctr+c`).
Rerun it without all those command line arguments.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

* Fonts are loading because `Access-Control-Allow-Origin` is set.
* `preflight` files are copied over to assets, because `writeToDisk` is set. Only allowing preflight files *through* for now.

At this point task of being able to run DevServer and to open `index.html` from local filesystem in browser that renders content correctly should be solved.

* JavaScript file is served by `webpack-dev-server`
* CSS content (embedded in JavaScript file) is served by `webpack-dev-server`
* Assets that are piped through loaders (in this case images and webfonts) is served by `webpack-dev-server` 
* `preflight.(js|css)` are outputted to local filesystem, HTML references them relatively
* `index.html` is opened directly from local filesystem

#### Run DevServer, `index.html` and static files served by webpack-dev-server

Static files that are not *compiled assets*, which currently are `public/index.html` as well as `public/assets/preflight.(js|css)` can be served by webpack DevServer (and that might be the correct approach as then FQDNs can be used, solving issues that currently are adressed by `miniCssExtractPublicPath`).

First *content base* for `devServer` config needs to be set.

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

Secondly  *properties.json* that is consumed by webpack config script needs change - setting `relativeUrlType` to false. It *can* be skipped due to the fact that webpack config script checks if DevServer is running and if yes, forces `relativeUrlType` to false automatically, thus setting everything to use FQDN.

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

Introduce a new self-declared ENV variable `DEV_SERVE_STATIC` (it could be any other name). It serves as mechanism to pass to webpack config script whether *webpack-dev-server* should serve static files - it is used to set `devServerServeStatic` flag.

Run DevServer

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
DEV_SERVE_STATIC=true \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Firing up [http://localhost:4000/](http://localhost:4000/) in the browser. 

* JavaScript file is served by `webpack-dev-server`
* CSS content (embedded in JavaScript file) is served by `webpack-dev-server`
* assets that are piped through loaders (in this case images and webfonts) is served by `webpack-dev-server` 
* `preflight.(js|css)` are outputted to filesystem, and are served by `webpack-dev-server` 
* `index.html` is served by `webpack-dev-server`

Opening `index.html` directly from filesystem works too.

Note that as all static assets are served by *webpack-dev-server* one could also set absolute FQDNs for preflight resources in `index.html` denoting the intent for the app to be consumed visa `localhost` now.

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

#### Run DevServer, static files served by Valet

Assuming one is working on this locally via `test` TLD using Valet as described in *Hello World* then everything should also be accessible via [http://webpacktest-04-devserver.test/](http://webpacktest-04-devserver.test) and there is no need for *webpack-dev-server* to serve static files.

There is even no need to set FQDN in *properties.json*, as `Access-Control-Allow-Origin` is set to `*`.

If the *semantically correct* way is chosen when using Valet props should be changed to

*properties.json*

```javascript
    "development": {
      "fqdn": "webpacktest-04-devserver.test",
      "tls": false,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
```

And FQDN should be changed also in `index.html` accordingly.

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
  <script src="http://webpacktest-04-devserver.test/assets/preflight.js"></script>
  <!-- <link href="assets/preflight.css" rel="stylesheet" type="text/css"> -->
  <link href="http://webpacktest-04-devserver.test/assets/preflight.css" rel="stylesheet" type="text/css">
  <!-- <link href="assets/index.css" rel="stylesheet" type="text/css"> -->
  <link href="http://webpacktest-04-devserver.test:4000/assets/index.css" rel="stylesheet" type="text/css">
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
  <script src="http://webpacktest-04-devserver.test:4000/assets/index.js"></script>
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

Open [http://webpacktest-04-devserver.test/](http://webpacktest-04-devserver.test/). It also should work by opening `public/index.html` file from file system (as CORS is set).

Note that `preflight.(js|css)` has no port attached to it in HTML, as these resources are served by nginx on port 80. If port `4000` was to be specified in HTML, then DevServer has to be served with static file serving enabled.

## npm scripting the additional build options

*package.json*

```json
  "scripts": {
    "front:dev:serve": "npm run clean:assets && NODE_ENV=development webpack-dev-server --config=$(pwd)/webpack.front.config.js -d",
    "front:dev:static": "npm run clean:assets && NODE_ENV=development DEV_SERVE_STATIC=true webpack-dev-server --config=$(pwd)/webpack.front.config.js -d",
    "front:build:dev": "npm run clean:assets && NODE_ENV=development webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:test": "npm run clean:assets && NODE_ENV=testing webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:stage": "npm run clean:assets && NODE_ENV=staging webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:prod": "npm run clean:assets && NODE_ENV=production webpack --config=$(pwd)/webpack.front.config.js --progress",
    "clean:assets": "rm -rf $(pwd)/public/assets/**"
  },
```

Test the scripts

_properties.json_

```json
    "development": {
      "fqdn": "localhost",
      "tls": false,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": "app-index-relative"
    }
```

_public/index.html_

In HTML use FQDN `src="http://localhost:4000/assets/..."`, `href="http://localhost:4000/assets/..."`.

Run with DevServer

```sh
npm run front:dev:serve
```
App can be run by run:

* by opening `index.html` from local filesystem in browser
* by opening [http://webpacktest-04-devserver.test](http://webpacktest-04-devserver.test) if Valet used.

```sh
npm run front:dev:static
```

App can be run by run:

* by opening [http://localhost:4000/](http://localhost:4000/)
* by opening `index.html` from local filesystem in browser.
* by opening [http://webpacktest-04-devserver.test](http://webpacktest-04-devserver.test) if Valet used.


_public/index.html_

In HTML use relative paths `src="assets/..."`, `href="assets/..."`.

```sh
npm run front:build:dev
```
App can be run by run:

* by opening `index.html` from local filesystem in browser
* by opening [http://webpacktest-04-devserver.test](http://webpacktest-04-devserver.test) if Valet used.

```sh
npm run front:build:test
```

App can be run by run:

* by opening `index.html` from local filesystem in browser
* by opening [http://webpacktest-04-devserver.test](http://webpacktest-04-devserver.test) if Valet used.

## Changing HTML based on environment / mode

As seen above one has to manually change *src/href* paths in `public/index.html` based on whether app is built for development (DevServer) or nondevelopment.  
This is inconvenient. Next chapter deals with that - dynamically building *HTML* so that it automatically sets source path URLs based on build target tier.

---
# Hot reloading

## The concept

Rerun DevServer. Assuming using `localhost`, `DEV_SERVE_STATIC=true` and *src/href* set accordingly in `public/index.html`.

```sh
npm run front:dev:static
```

Refresh webpage [http://localhost:4000/](http://localhost:4000/)

Enter something in text input field (the one that has placeholder *Text Here*) using browser.

Without stopping DevServer change something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(150px);
```

and save file.

Webpage is automatically refreshed showing the change in SCSS, which is nice and works OOB. However, the text entered in the input field is lost as the page got refreshed. Or if put otherwise, *the state was lost*. It is inconvenient, especially once one gets to frontend frameworks that are stateful.

*The concept* is stateful reload.

## Enable hot reloading in development

_webpack.front.config.js_

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
}

```

## Test hot reloading

Kill previous instance.

Rerun DevServer.

```sh
npm run front:dev:static
```

Refresh [http://localhost:4000/](http://localhost:4000/). Enter something in input field using browser.

Make changes again in SCSS

_src/index.global.scss_

```scss
  transform: translateY(70px);
```

and save file.

Now the page applies the changed SCSS without refreshing, but *hot reloading*. The text that was entered in the input field is still there as *state* is kept.

Remember to kill DevServer.

## Disabling MiniCssExtractPlugin for hot reloading CSS

When running DevServer CSS has be inlined within JavaScript so that hot reloading works. Sure, it will result in `404` for `assets/index.css` and FOUCs, but it is ok for rapid development. This is just a note as loader pipe in _webpack.config.js_ is configured that *style-loader* is used instead of *MiniCssExtractPlugin.loader* when on development. 

---
# Result

See `webpacktest-04-devserver` directory.  
Images and fonts have to be copied to `src/..` from `media/..`.

---
# Next
---

Dynamic HTML building will cover how HTML building could be automated.
