# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# PREFLIGHT
---

Use existing `webpacktest-basic` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-devserver`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-devserver.dev`.

---
# Webpack dev server
---

We use hot reloading always. This is something like `watch` in gulp which we abused. But this is better out-of-box, especially for React (hot reloading while keeping state).

## Install

### Webpack webpack-dev-server

Documentation  
[webpack-dev-server](https://github.com/webpack/webpack-dev-server)

Install dev server

```sh
npm install webpack-dev-server --save-dev
```

### manage-htaccess

Skip this if not on Apache.  
We will need port proxying. Instead of proxying within Apache2 vhost or NGINX proxy (ze best!), this will give us fast proxy on/off in on Apache managed via `.htaccess`  
[manage-htaccess](https://github.com/WARP-LAB/manage-htaccess)

```sh
npm install manage-htaccess --save-dev
```

## Basic setup


### If you are testing this locally via `localhost` or named host (i.e., `webpacktest-devserver.dev` via Valet nginx service)


Add `publicPath` to config and make css extraction conditional. Use `localhost` instead of `webpacktest-devserver.dev` if needed.

```javascript
// ...
  output: {
    path: path.join(__dirname, 'public/assets'),
    filename: '[name].js',
    publicPath: production ? '//webpacktest-devserver.dev/assets/' : 'http://webpacktest-devserver.dev:4000/assets/'
  },
  
// ...

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: development, // disable when development
  allChunks: true
}));

// ...  
```

Manually change your html too for now. Use `localhost` instead of `webpacktest-devserver.dev` if needed.


```html
<!DOCTYPE html>
<html class="noscript">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="http://webpacktest-devserver.dev:4000/assets/preflight.js"></script>
  <link rel="stylesheet" type="text/css" href="http://webpacktest-devserver.dev:4000/assets/site.css">
</head>
<body>
  <div class="app"></div>
  <script>
    var dataReact = {};
  </script>
  <script async src="http://webpacktest-devserver.dev:4000/assets/site.js"></script>
</body>
</html>

```

If using Valet then `index.html`is already served by nginx

```sh
rm -rf public/assets/** && \
NODE_ENV=development node_modules/.bin/webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=webpacktest-devserver.dev --port=4000 --history-api-fallback -d --inline
```


If just using localhost then `index.html`is not served by webserver, and we need to attach `--content-base`

```sh
rm -rf public/assets/** && \
NODE_ENV=development node_modules/.bin/webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=localhost --port=4000 --history-api-fallback -d --inline --content-base $(pwd)/public
```

Visit [http://webpacktest-devserver.dev/](http://webpacktest-devserver.dev/) or [http://localhost:4000/](http://localhost:4000/), based on your setup.

If you are using `localhost`, then replace `webpacktest-basic.dev` to `localhost` in config and webpack-dev-server run command and visit [http://localhost:4000/](http://localhost:4000/)

### If you are doing this under dev server

Ask

## Extended webpack-dev-server configuration and CORS

As you might have caught, webfonts are not loaded, because we visit `http://webpacktest-basic.dev:80`, but fonts are served by webpack dev server from `http://webpacktest-basic.dev:4000`.

Let us move webpack dev server configuration within `webpack.confg.js` and extend it.

```javascript
// ...

// ----------------
// PUBLIC PATH based on env
const publicPath = production ? '//webpacktest-basic.dev/assets/' : 'http://webpacktest-devserver.dev:4000/assets/';

// ...

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
  host: 'webpacktest-basic.dev', // CLI ONLY
  
  // either use cli --hot (and --inline) or this config flag
  // when using this config we need to manually also add webpack.HotModuleReplacementPlugin()
  // hot: true,
  // hotOnly: true

  https: false,
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
  port: 4000,
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

// ...
```

Kill revious `ctr+c`. Rerun it, observe that fonts are loading now.


```sh
rm -rf public/assets/** && \
NODE_ENV=development node_modules/.bin/webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Note that `contentBase` key should be set if using `localhost`.


## Hot reloading


Enable hot reloading in development

```javascript
// ...

config.devServer = {
  // ...
  hot: true,
  // ...
  inline: true
  // ...
};

// ...

if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
}
```

## Reload CSS

When running dev server we actually want CSS to be inlined within JavaScript (which will result in `404` for `assets/site.css` and FOUC) so that hot reloading works better.

We actually have it already going in _webpack.config.js_ as *ExtractTextPlugin* falls back to `style-loader` when on development. Why? Because in `new ExtractTextPlugin()` config we have set `disable: development`

Other approach would be

_webpack.config.js_

```javascript
// ...
    {
      test: /\.(scss)$/,
      use: development
      ? [ /* ... */ ]
      : ExtractTextPlugin.extract({fallback: 'style-loader', use: [ /* ... */ ]})
    },

// ...

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: false, // always on, rules hold conditional
  allChunks: true
}));
// ...
```

or having seperate `webpack.config.devempoment.js`, `webpack.config.production.js`, etc. altogether to use for different ENVs.

### Test hot reloading

Opened page should contain `Hello JS` and your beautiful background images.

Fire up _src/site.global.scss_ and change height of app div, observe browser.

```scss
// ...
  height: 400px;
// ...
```
Now kill `ctrl+c` devserver. 


---
# Use npm `scripts`!
---

It is hard to remember all the commands that need to be executed to run stuff. Therefore always make shortcuts. IMHO `package.json` scripts section should reflect what this package can do!

We 
* add `scripts` key to `package.json`
* add `config` key to `package.json` and use those values both in `scripts` as well as in `webpack.config.js`
* add `browserslist` key to `package.json` (or `browserslist`/`.browserslistrc` file) and remove `browsers` key from `.postcssrc.js` 

```json
{
  "config": {
    "portFrontendMainHTTP": "80",
    "portFrontendMainHTTPS": "443",
    "portBackendMainHTTP": null,
    "portBackendMainHTTPS": null,
    "portFrontendAppHTTP1": 3000,
    "portFrontendAppHTTP2": 3001,
    "portBackendAppHTTP1": null,
    "portBackendAppHTTP2": null,
    "portFrontendWebpackDevServerHTTP": "4000",
    "portFrontendWebpackDevServerHTTPS": null,
    "portBackendWebpackDevServerHTTP": null,
    "portBackendWebpackDevServerHTTPS": null,
    "isWebpackDevServerFrontendHTTPS": false,
    "isWebpackDevServerBackendHTTPS": false,
    "isWebpackDevServerHot": true,
    "hostDevelopment": "webpacktest-devserver.dev",
    "pathAboveRootDevelopment": "",
    "hostTesting": "webpacktest-devserver.dev",
    "pathAboveRootTesting": "",
    "hostStaging": "webpacktest-devserver.dev",
    "pathAboveRootStaging": "",
    "hostProduction": "webpacktest-devserver.dev",
    "pathAboveRootProduction": ""
  },
  "browserslist": {
    "development": [
      "last 2 versions",
      "Explorer 10",
      "iOS > 7"
    ],
    "production": [
      "last 2 versions",
      "Explorer 10",
      "iOS > 7"
    ]
  },
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "build:front:dev": "npm run build:front:clean && NODE_ENV=development webpack-dev-server --config=$(pwd)/webpack.front.config.js -d",
    "build:front:test": "npm run build:front:clean && NODE_ENV=testing webpack --config=$(pwd)/webpack.front.config.js --progress",
    "build:front:stage": "npm run build:front:clean && NODE_ENV=staging webpack --config=$(pwd)/webpack.front.config.js --progress",
    "build:front:prod": "npm run build:front:clean && NODE_ENV=production webpack --config=$(pwd)/webpack.front.config.js --progress",
    "build:front:clean": "rm -rf ./public/assets/*",
    "screen:start": "npm run screen:stop && screen -S webpacktest-devserver -d -m npm run build:front:dev",
    "screen:enter": "screen -r webpacktest-devserver",
    "screen:stop": "screen -S webpacktest-devserver -X quit 2>/dev/null || :",
    "fly:front:testing": "echo \"Flightpan is different topic\" && exit 0",
    "fly:front:staging": "echo \"Flightpan is different topic\" && exit 0",
    "fly:front:production": "echo \"Flightpan is different topic\" && exit 0"
  }
}
```

*.browserslistrc* or *browserslist* (instead of key in `package.json`)

Inspect file.

Note that rules can be specified in one place. If you specify them in both `package.json` and config file, you won't be able to build the project

```
Module build failed: BrowserslistError: /path/to/project contains both .browserslistrc and package.json with browsers
```
*webpack.front.config.js*

```javascript
const pkgConfig = require('./package.json');
// use pkgConfig.config object now

```
Inspect file.


* `npm run build:front:dev` to run development

* `npm run build:front:prod` to run production  
remember that for this guide you would have to remove `:4000` from `index.html` manually to see production results, if running locally. our devserver does proxy automatically though.

* `npm run build:front:dev` to run dev-server

	* `npm run sreen:start` to start dev-server in a separate screen  
	* `npm run screen:stop` to stop dev-server in that separate screen
	* `npm run screen:enter` to attach to the running screen so you can inspect building errors.
