# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# PREFLIGHT
---

Use existing `webpacktest-basic` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-devserver`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-devserver.test` (or `localhost`).

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

If on Apache within our devserver, ask.

## Basic setup

### If you are testing this locally via `localhost` or named host (i.e., `test` TLD via Valet nginx service)


Add `publicPath` to config and make css extraction conditional. 

```javascript
// ...

// ----------------
// PUBLIC PATH based on env
const publicPath = production ? '//webpacktest-devserver.test/assets/' : 'http://webpacktest-devserver.test:4000/assets/';

// ...

  output: {
    path: outputPath,
    filename: '[name].js',
    publicPath
  },
  
// ...

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: development, // disable when development
  allChunks: true
}));

// ...  
```

Use

```javascript
production ? '//webpacktest-devserver.test/assets/' : '//localhost:4000/assets/'
```

if needed.


Manually change your html too for now. Use `localhost` instead of `webpacktest-devserver.test` if needed.

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <!--
  <script src="//webpacktest-devserver.test/assets/preflight.js"></script>
  <link href="//webpacktest-devserver.test/assets/preflight.css" rel="stylesheet" type="text/css">
  -->
  <link href="//webpacktest-devserver.test:4000/assets/index.css" rel="stylesheet" type="text/css">
</head>
<body>
  <!--
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  -->
  <div class="app"></div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <script async src="//webpacktest-devserver.test:4000/assets/index.js"></script>
</body>
</html>

```

Note that CSS state machine is disabled for now.

If using Valet then `index.html`is already served by nginx through named host

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=webpacktest-devserver.test --port=4000 --history-api-fallback -d --inline
```

If just using localhost then `index.html` is served by Webpack dev server thrugh localhost, and we need to attach `--content-base`

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=localhost --port=4000 --history-api-fallback -d --inline --content-base $(pwd)/public
```

Visit [http://webpacktest-devserver.test/](http://webpacktest-devserver.test/) or [http://localhost:4000/](http://localhost:4000/), based on your setup.

If you are using `localhost`, then replace `webpacktest-devserver.test` to `localhost` in config and webpack-dev-server run command and visit [http://localhost:4000/](http://localhost:4000/)

### If you are doing this under dev server

Ask

## Extended webpack-dev-server configuration and CORS when using nginx

As you might have caught, webfonts are not loaded when visiting `http://webpacktest-devserver.test:80` which is served by nginx as fonts are served by webpack dev server from `http://webpacktest-devserver.test:4000`.

Let us move webpack dev server configuration within `webpack.front.confg.js` and extend it.

```javascript
// ...

// ----------------
// WEBPACK DEV SERVER

config.devServer = {
  // -d is shorthand for --debug --devtool source-map --output-pathinfo
  allowedHosts: [
    '.test',
    'localhost'
  ],
  clientLogLevel: 'info',
  compress: true,
  contentBase: false, // path.join(__dirname, 'public'), // pass content base if not using nginx
  disableHostCheck: false,
  // filename: 'index.js', // used if lazy true
  headers: {
    'Access-Control-Allow-Origin': '*'
  },
  historyApiFallback: true,
  host: 'webpacktest-devserver.test',

  // either use cli --hot (and --inline) or this config flag
  // needs webpack.HotModuleReplacementPlugin() which is now enabled automatically
  // hot: true,
  // hotOnly: true

  https: false,
  // https: {
  //   key: fs.readFileSync('/path/to/server.key'),
  //   cert: fs.readFileSync('/path/to/server.crt'),
  //   ca: fs.readFileSync('/path/to/ca.pem')
  // }
  index: 'index.htm',
  inline: true,
  // lazy: true,
  noInfo: false,
  open: false,
  // openPage: '/different/page',
  overlay: {
    warnings: false,
    errors: true
  },
  port: 4000,
  // proxy: {
  //   '/api': 'http://localhost:3000'
  // },
  // public: 'myapp.test:80',
  publicPath,
  quiet: false,
  // socket: 'socket',
  // staticOptions: null,
  // stats: null,
  useLocalIp: false,
  // watchContentBase: true,
  // watchOptions: {
  //   poll: true
  // },
  before(app){
    console.log('Webpack devserver middlewres before');
  },
  after(app){
    console.log('Webpack devserver middlewres after');
  }
};

// ...
```

Kill revious `ctr+c`. Rerun it, observe that fonts are loading now.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Note that some of the values should be set to `localhost` instead of named host, based on your setup.


## Hot reloading

If you change something now in the source, say `index.global.scss` and save it, webpage is automatically refreshed. We can do better.

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

// ----------------
// Hot reloading and named modules

if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
} else {
  config.plugins.push(new webpack.HashedModuleIdsPlugin());
}
```

## Reload CSS

When running dev server we actually want CSS to be inlined within JavaScript (which will result in `404` for `assets/index.css` and FOUC) so that hot reloading works better.

We actually have it already going in _webpack.config.js_ as *ExtractTextPlugin* falls back to `style-loader` when on development. Why? Because in `new ExtractTextPlugin()` config we have set `disable: development`

Other approach can be having seperate `webpack.config.development.js`, `webpack.config.production.js`, etc. altogether to use for different ENVs.

### Test hot reloading

Opened page should contain `Hello JS` and your beautiful background images.

Fire up _src/index.global.scss_ and change transform of app div, observe browser.

```scss
// ...
  transform: translateY(50px);
// ...
```

Now the page itself does not reload on changes. Hot!

Now kill `ctrl+c` devserver. 

## Changing port number in `index.html` manually

Remember that at this stage you would have to remove `:4000` from `index.html` manually to see production results, if running locally. Dynamic HTML building will cover how this can and should be automated.

---
# Use npm `scripts`!
---

It is hard to remember all the commands that need to be executed to run stuff. Therefore always make shortcuts. IMHO `package.json` scripts section should reflect what this package can do!

We 

* add `scripts` key to `package.json`
* add `config` key to `package.json` and use those values both in `scripts` as well as in `webpack.config.js`

By doing so

* `npm run build:front:dev` to run development

* `npm run build:front:prod` to run production  

* `npm run sreen:start` to start dev-server in a separate screen  
* `npm run screen:stop` to stop dev-server in that separate screen
* `npm run screen:enter` to attach to the running screen so you can inspect building errors.

Check source of this section to see how it is implemented in `package.json` (`config` key and later using `$npm_package_*`) and how the values are used in `webpack.front.config.js` (loading values in `pkgConfig` and using it).