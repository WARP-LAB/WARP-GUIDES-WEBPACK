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

Skip this if not on Apache within our devserver.  
We will need port proxying. Instead of proxying within Apache2 vhost or NGINX proxy (ze best!), this will give us fast proxy on/off in on Apache managed via `.htaccess`  
[manage-htaccess](https://github.com/WARP-LAB/manage-htaccess)

```sh
npm install manage-htaccess --save-dev
```

## Basic setup


### If you are testing this locally via `localhost` or named host (i.e., `test` TLD via Valet nginx service)


Add `publicPath` to config and make css extraction conditional. 

```javascript
// ...
  output: {
    path: path.join(__dirname, 'public/assets'),
    filename: '[name].js',
    publicPath: production ? '//webpacktest-devserver.test/assets/' : '//webpacktest-devserver.test:4000/assets/'
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
publicPath: production ? '//webpacktest-devserver.test/assets/' : '//localhost:4000/assets/'
```

if needed.


Manually change your html too for now. Use `localhost` instead of `webpacktest-devserver.test` if needed.

```html
<!DOCTYPE html>
<html class="noscript">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="//webpacktest-devserver.test:4000/assets/preflight.js"></script>
  <link rel="stylesheet" type="text/css" href="//webpacktest-devserver.test:4000/assets/site.css">
</head>
<body>
  <div class="app"></div>
  <script>
    var dataReact = {};
  </script>
  <script async src="//webpacktest-devserver.test:4000/assets/site.js"></script>
</body>
</html>

```

If using Valet then `index.html`is already served by nginx through named host

```sh
rm -rf public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=webpacktest-devserver.test --port=4000 --history-api-fallback -d --inline
```


If just using localhost then `index.html` is served by Webpack dev server thrugh localhost, and we need to attach `--content-base`

```sh
rm -rf public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=localhost --port=4000 --history-api-fallback -d --inline --content-base $(pwd)/public
```

Visit [http://webpacktest-devserver.test/](http://webpacktest-devserver.test/) or [http://localhost:4000/](http://localhost:4000/), based on your setup.

If you are using `localhost`, then replace `webpacktest-devserver.test` to `localhost` in config and webpack-dev-server run command and visit [http://localhost:4000/](http://localhost:4000/)

### If you are doing this under dev server

Ask

## Extended webpack-dev-server configuration and CORS when using nginx

As you might have caught, webfonts are not loaded, because we visit `http://webpacktest-devserver.test:80` which is served by nginx, but fonts are served by webpack dev server from `http://webpacktest-devserver.test:4000`.

Let us move webpack dev server configuration within `webpack.front.confg.js` and extend it.

```javascript
// ...

// ----------------
// PUBLIC PATH based on env
const publicPath = production ? '//webpacktest-devserver.test/assets/' : '//webpacktest-devserver.test:4000/assets/';

// ...

// ----------------
// WEBPACK DEV SERVER
// https://webpack.js.org/configuration/dev-server/#devserver

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
  // filename: 'site.js', // used if lazy true
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
  //   key: fs.readFileSync("/path/to/server.key"),
  //   cert: fs.readFileSync("/path/to/server.crt"),
  //   ca: fs.readFileSync("/path/to/ca.pem"),
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
rm -rf public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Note that some of the values should be set to `localhost` instead of named host, based on your setup.


## Hot reloading

If you change something now in the source, say `site.global.scss` and save it, webpage is automatically refreshed. We can do better.

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


* `npm run build:front:dev` to run development

* `npm run build:front:prod` to run production  
remember that for this guide you would have to remove `:4000` from `index.html` manually to see production results, if running locally. our devserver does proxy automatically though.

* `npm run sreen:start` to start dev-server in a separate screen  
* `npm run screen:stop` to stop dev-server in that separate screen
* `npm run screen:enter` to attach to the running screen so you can inspect building errors.
