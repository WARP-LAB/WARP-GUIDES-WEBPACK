# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# In this section
---

* webpack DevServer setup
* making it hot
* npm config and scripts

---
# Prefligt
---

Use existing `webpacktest-cssandfiles` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-devserver`. Make changes in `package.json` name field. Don't forget `npm install`.

---
# Webpack DevServer
---

Use hot reloading when developing.

## Install

### Webpack webpack-dev-server

Documentation  
[webpack-dev-server](https://github.com/webpack/webpack-dev-server)

Install DevServer

```sh
npm install webpack-dev-server --save-dev
```

## Basic setup

### Assuming you are testing this locally via `test` TLD using nginx as described in *Hello World*


#### Configure public path

Add `publicPath` to config and make CSS extraction conditional. 

*webpack.front.config.js*

```javascript
// ...

// ----------------
// Output public path based on env
const targetHost = 'webpacktest-devserver.test';
const outputPublicPath = production ? `//${targetHost}/assets/` : `http://${targetHost}:4000/assets/`;

// ...

  output: {
    path: outputPath,
    filename: '[name].js',
    publicPath: outputPublicPath
  },
  
// ...

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: development, // disable when development
  allChunks: true
}));

// ...  
```

#### HTML

Manually change your HTML too for now.

*index.html*

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <script src="//webpacktest-devserver.test/assets/preflight.js"></script>
  <link href="//webpacktest-devserver.test/assets/preflight.css" rel="stylesheet" type="text/css">
  <link href="//webpacktest-devserver.test:4000/assets/index.css" rel="stylesheet" type="text/css">
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
  <div class="app"></div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <script async src="//webpacktest-devserver.test:4000/assets/index.js"></script>
</body>
</html>
```

#### Run devserver

If using Valet then `index.html`is already served by nginx through named host

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=webpacktest-devserver.test --port=4000 --history-api-fallback -d --inline
```

`-d` is shorthand for `--debug --devtool source-map --output-pathinfo`

Visit [http://webpacktest-devserver.test/](http://webpacktest-devserver.test/) and inspect.

### If you are testing this using `localhost` having Node.js server (or even if you are using nginx, you should try this).

Then here is quick intro how to do this. Note that further everything will be explained as if it was served by nginx (both for development and production builds), however this should get you started how and where to replace `namedhost.test` with `localhost` as well as difference in port settings (for development builds).

#### Configure public path

Then use localhost as hostname as well as public path such as

*webpack.front.config.js*

```javascript
const targetHost = 'localhost';
const outputPublicPath = production ? `//${targetHost}:3333/assets/` : `http://${targetHost}:4000/assets/`;
```

here and in the future. 

#### HTML

Everything served through 4000 port on localhost.

*index.html*

```html
  <script src="//localhost:4000/assets/preflight.js"></script>
  <link href="//localhost:4000/assets/preflight.css" rel="stylesheet" type="text/css">
  <link href="//localhost:4000/assets/index.css" rel="stylesheet" type="text/css">
  <script async src="//localhost:4000/assets/index.js"></script>
```

#### Run devserver

If just using localhost then `index.html` (as well as `preflight.js|css` in `assets`) has to be served by webpack DevServer, and we need to attach `--content-base` in order to do so.

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=localhost --port=4000 --history-api-fallback -d --inline --content-base $(pwd)/public
```

Visit [http://localhost:4000/](http://localhost:4000/) and inspect.

### If you are doing this under dev server

Ask

## CORS when using nginx together with webpack DevServer and Extended webpack-dev-server configuration and 

As you might have caught, webfonts are not loaded when visiting `http://webpacktest-devserver.test` (thus port 80) which is served by nginx as fonts are served by webpack DevServer from in-memory at `http://webpacktest-devserver.test:4000`. 80 is not 4000.

*Access to Font at 'http://webpacktest-devserver.test:4000/assets/a1e901473e0acbcecfaf8442675f87a7.woff2' from origin 'http://webpacktest-devserver.test' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://webpacktest-devserver.test' is therefore not allowed access.*

Let us move webpack DevServer configuration from inline commands to within `webpack.front.confg.js` and extend it.

```javascript
// ...

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
  hot: false,
  // hotOnly: true

  https: false,
  // https: {
  //   ca: fs.readFileSync('/path/to/ca.pem'),
  //   key: fs.readFileSync('/path/to/server.key'),
  //   cert: fs.readFileSync('/path/to/server.crt')
  // },
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
  port: 4000,
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

// ...
```

Kill revious `ctr+c`. Rerun it, observe that fonts are loading now.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

## Setting up hot reloading

Kill revious `ctr+c`. Rerun DevServer.

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Hardrefresh webpage.

Enter something in input field (the one that has placeholder *Text Here*) using browser.

Change something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(150px);
```

and save file.

Webpage is automatically refreshed, which is nice, but we can do better. See, the text you entered in input field is lost as the page got refreshed. Or if put otherwise, *you lost state* which is very inconvenient (especially once you'll get to *React*).

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
// Hot reloading and named modules

if (development) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  config.plugins.push(new webpack.NamedModulesPlugin());
} else {
  config.plugins.push(new webpack.HashedModuleIdsPlugin());
}
```

## Test hot reloading

Kill revious `ctr+c`. Rerun DevServer.

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

Hardrefresh webpage.

Enter something in input field (the one that has placeholder *Text Here*) using browser.

Change something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(70px);
```

and save file.

Now the page itself does not reload, only SCSS and text you entered in input field is still there. *State* is kept! Hot!

Now kill `ctrl+c` devserver. 

## Disabling ExtractTextPlugin for hot reloading CSS

When running dev server we actually want CSS to be inlined within JavaScript so that hot reloading works better. Which will result in `404` for `assets/index.css` and FOUC, but it is ok for development.

We have it already going in _webpack.config.js_ as *ExtractTextPlugin* falls back to `style-loader` when on development. Why? Because in `new ExtractTextPlugin()` config we have set `disable: development`, see in the first steps of this chapter.

Other approach can be having seperate `webpack.config.development.js`, `webpack.config.production.js`, etc. altogether to use for different ENVs.

## Changing port number in `index.html` manually

Remember that at this stage you would have to remove `4000` from assets referenced in `index.html` manually to see production results, as then all files are outputted in real filesystem and served by nginx (port `80`).  
Or in case you are not using `nginx` you would have to serve public folder by some Node.js server at say `3333` port, thus also needing changes in `index.html`. This is stupid, right. How about building *HTML* so that it automatically sets those port numbers for us based on build target? See that in next section.

---
# Use npm `scripts`!
---

It is hard to remember all the commands that need to be executed to run stuff. Therefore always make shortcuts. IMHO `package.json` scripts section should reflect what this package can do!

We 

* add `scripts` key to `package.json`
* add `config` key to `package.json` and use those values both in `scripts` within `package.json` itself as well as in `webpack.config.js`

By doing so

* `npm run build:front:dev` to run development
* `npm run build:front:prod` to run production  

Check source of this section to see

* new keys `config` and `scripts` in `package.json`
* how `sripts` can relate to `config` values within `package.json` itself by using `$npm_package_*`
* how `config` values are used in `webpack.front.config.js`, by loading values in `pConfig` object and using it throughout the webpack config file

---
# Next
---

Dynamic HTML building will cover how HTML building can and should be automated.
