# webpack DevServer and hot reloading

---
# In this section
---

* webpack DevServer setup
* CORS
* making it hot
* Introducing npm scripts and config example

---
# Prefligt
---

Use existing `webpacktest-cssandfiles` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-devserver`. Make changes in `package.json` name field. Don't forget `npm install`.  
Copy `media/images` to `src/` and `media/fonts/spacemono` to `src/fonts/`.

---
# Webpack DevServer
---

Use hot reloading when developing.

## Install

### Webpack webpack-dev-server

Documentation  
[webpack-dev-server](https://github.com/webpack/webpack-dev-server)

Install *webpack-dev-server*

```sh
npm install webpack-dev-server --save-dev
```

## Basic setup

Till now webpages could be loaded by simply opening `public/index.html` in browser from local filesystem (or using `test` TLDs if you are using Valet). 

When `webpack-dev-server` is run it spawns Node.js server on the local machine that serves built assets, currently it would be the bult `index.js`.

### Running webpack-dev-server on `localhost`

#### Configure public path

*webpack.front.config.js*

```javascript
// ...

// ----------------
// Output filesystem path
const outputPathFsBuild = path.join(__dirname, 'public/assets/');

// ----------------
// Output public path
const outputPathPublicUrlRelativeToApp = 'assets/';

// ----------------
// Host, port, output public path based on env
let targetAppHostname;
let targetAppPortNumber;
let outputPublicAssetsUrlFinal;

targetAppHostname = 'localhost';
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

// ...  

let config = {
  // ...
  output: {
    path: outputPathFsBuild,
    publicPath: webpackConfigOutputPublicPath,
    filename: '[name].js'
  },
  // ...
};

```

#### HTML

Manually change your HTML too for now.

Prefligt JS and CSS files are copied no matter what to assets directory, so we can still use relative paths for those.

But for all things that webpack is *building* set absolute path.

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
  <script src="http://localhost:4000/assets/index.js"></script>
</body>
</html>
```

#### Run devserver, `index.html` from local filesytem

Run devserver

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=localhost --port=4000 --history-api-fallback -d --inline
```

Open `public/index.html` in browser as until now (unless you have gone Valet route) in your browser.

Page opens and we have two issues.
First one is is that webfonts are not loaded and console spits `Access to font (..) has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource`.
Second is that prefligt js and css is not loaded and they are not in assets directory.

Let us fix that.


#### CORS policy webpack-dev-server configuration 

As you might have caught, webfonts are not loaded when opening `index.html` file localy as they are seved via `http://localhost:4000/'

Let us move webpack-dev-server configuration from inline commands to an object within `webpack.front.confg.js`.

[Configuration options](https://webpack.js.org/configuration/dev-server/#devserver) are quite extensive, let us fill in some.

*webpack.front.config.js*

```javascript
// ...

// ----------------
// DevServer CONFIG
config.devServer = {
  host: targetAppHostname,
  port: targetAppPortNumber,

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

// ...
```

Kill previous `ctr+c`. Rerun it (now without all those command line arguments) and observe.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Fonts are loading because `Access-Control-Allow-Origin` is set.
And `preflight` files are copied over to assets, because `writeToDisk` is set. Only allowing preflight files *through*, no `index.js`, fonts, images as there is no need for that.

#### Run devserver, `index.html` served by webpack-dev-server

Static files that are not generated assets, which currently in our case are `public/index.html` as well as `public/assets/preflight.(js|css) can be served by webpack-dev-server (and that might be the correct apprach). We need to set *content base* for that.

*webpack.front.config.js*

```javascript
// ...

const devServeStatic = !!process.env.DEV_SERVE_STATIC && process.env.DEV_SERVE_STATIC === 'true';

// ----------------
// Output filesystem path
const outputPathFsContentBase = path.join(__dirname, 'public/');
const outputPathFsAssetsSuffix = 'assets/';
const outputPathFsBuild = path.join(__dirname, `public/${outputPathFsAssetsSuffix}`);

// ...

  contentBase: (devServeStatic) ? outputPathFsContentBase : false,

// ...  

```

As seen we introduce new self-declared ENV variable `DEV_SERVE_STATIC` (it could be any other name). It lets us pass command line option whether *webpack-dev-server* should serve static files. 

Run devserver

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development DEV_SERVE_STATIC=true \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Fire up [http://localhost:4000/](http://localhost:4000/) in the browser. 

Note that as all static assets are served mby Node.js *webpack-dev-server* we could also set absolute paths for prefligt resources in HTML

```html
  <script src="http://localhost:4000/assets/preflight.js"></script>
  <link href="http://localhost:4000/assets/preflight.css" rel="stylesheet" type="text/css">
```

#### Run devserver, `index.html` served by nginx

Assuming you are working on this locally via `test` TLD using nginx as described in *Hello World* then everything should also be accessible via [http://webpacktest-devserver.test/](http://webpacktest-devserver.test) and there is no need for *webpack-dev-server* to serve static files.

We just need to set correct hostname.

*webpack.front.config.js*

```javascript
// ...

targetAppHostname = 'webpacktest-devserver.test'; // 'localhost';

// ...
```

And change hostname also in index.html

*index.html*

```html
  <link href="http://webpacktest-devserver.test:4000/assets/index.css" rel="stylesheet" type="text/css">
  <script src="http://webpacktest-devserver.test:4000/assets/index.js"></script>
```

Run devserver without static file serving

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development DEV_SERVE_STATIC=false \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Open [http://webpacktest-devserver.test/](http://webpacktest-devserver.test). It also should work by opening `public/index.html` file from file system (as CORS is set).

Note that as all static assets are served mby nginx (port 80) we could also set absolute paths for prefligt resources in HTML

```html
  <script src="http://webpacktest-devserver.test/assets/preflight.js"></script>
  <link href="http://webpacktest-devserver.test/assets/preflight.css" rel="stylesheet" type="text/css">
```

## Setting up hot reloading

Rerun devserver. Whatever approach, assuming using `localhost` with `DEV_SERVE_STATIC=true` (change `targetAppHostname` and `public/index.html` contents accordingly if necessary).

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development DEV_SERVE_STATIC=true \
npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Refresh webpage [http://localhost:4000/](http://localhost:4000/)

Enter something in text input field (the one that has placeholder *Text Here*) using browser.

Without stopping devserver change something in SCSS

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
  // config.plugins.push(new webpack.NamedModulesPlugin()); // enabled in development mode by default https://webpack.js.org/configuration/mode/
}

```

## Test hot reloading

Kill previous instance `ctr+c`. Rerun devserver. Refresh webpage.

Enter something in input field (the one that has placeholder *Text Here*) using browser.

Change again something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(70px);
```

and save file.

Now the page applies the changed SCSS without refreshing, but *hot reloading*. The text you entered in input field is still there as *state* is kept.

Now kill `ctrl+c` devserver.

## Disabling MiniCssExtractPlugin for hot reloading CSS

This is just a note as we have it already going in _webpack.config.js_ where *style-loader* is used instead of *MiniCssExtractPlugin* when on development. When running dev server we want CSS to be inlined within JavaScript so that hot reloading works. Sure, it will result in `404` for `assets/index.css` and FOUCs, but it is ok for rapid development.

## Changing port numbers based on environment / mode in `index.html` automatically

What happens if building for `testing` now?

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack \
--config=$(pwd)/webpack.front.config.js --progress
```

Well, one has to manually change `index.html` file and change paths from `http://localhost:4000/assets/file.ext` to `assets/file.ext`. This is inconvenient. How about building *HTML* so that it automatically sets those port numbers for us based on build target? See that in next section.

---
# Next
---

Dynamic HTML building will cover how HTML building could be automated.
