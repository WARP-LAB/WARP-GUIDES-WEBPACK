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
Copy `images` to `src` and `spacemono` to `src/fonts` from `media`.

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

### Assuming you are working on this locally via `test` TLD using nginx as described in *Hello World*


#### Configure public path

Set `publicPath` value conditional. 

*webpack.front.config.js*

```javascript
// ...

// ----------------
// Target host
const targetAppHostname = 'webpacktest-devserver.test';

// ----------------
// Output public path
const outputPublicPathWithPort = development ? `http://${targetAppHostname}:4000/assets/` : `//${targetAppHostname}/assets/`;

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
  <meta name="description" content="Webpack Guide">
  <meta name="keywords" content="webpack,guide">
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
  <div class="app"> Loading... </div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <script src="//webpacktest-devserver.test:4000/assets/index.js"></script>
</body>
</html>
```

#### Run devserver

If using Valet then `index.html` is already served by nginx through named host

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server --config=$(pwd)/webpack.front.config.js --host=webpacktest-devserver.test --port=4000 --history-api-fallback -d --inline
```

`-d` is shorthand for `--debug --devtool source-map --output-pathinfo`

Visit [http://webpacktest-devserver.test/](http://webpacktest-devserver.test/) and inspect.

### If you are working using `localhost` having Node.js server (or even if you are using nginx, you should try this).

Then here is quick intro how to do this. Note that further everything will be explained as if it was served by nginx (both for development and testing tier builds), however this should get you started how and where to replace `namedhost.test` with `localhost` as well as difference in port settings (for development builds).

#### Configure public path

Then use localhost as hostname as well as public path such as

*webpack.front.config.js*

```javascript
const targetAppHostname = 'localhost';
const outputPublicPathWithPort = development ? `//${targetAppHostname}:4000/assets/` : `//${targetAppHostname}/assets/`;
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

## CORS when using nginx together with webpack DevServer and extended webpack-dev-server configuration 

As you might have caught, webfonts are not loaded when visiting `http://webpacktest-devserver.test` (thus port 80) which is served by nginx as fonts are served by webpack DevServer from in-memory at `http://webpacktest-devserver.test:4000`. 80 is not 4000.

*Access to Font at 'http://webpacktest-devserver.test:4000/assets/a1e901473e0acbcecfaf8442675f87a7.woff2' from origin 'http://webpacktest-devserver.test' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://webpacktest-devserver.test' is therefore not allowed access.*

Let us move webpack DevServer configuration from inline commands to within `webpack.front.confg.js` and extend it.

```javascript
// ...

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

  contentBase: false, // path.join(__dirname, 'public'), // pass content base if not using nginx to serve files
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
  hot: false,
  // hotOnly: true

  https: false,
  // https: {
  //   ca: fs.readFileSync(`${require('os').homedir()}/.valet/CA/LaravelValetCASelfSigned.pem`),
  //   key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.key`),
  //   cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHostname}.crt`)
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
  publicPath: outputPublicPathWithPort,
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

// ...
```

Kill previous `ctr+c`. Rerun it and observe how fonts are loading.


```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development npx webpack-dev-server \
--config=$(pwd)/webpack.front.config.js -d
```

## Setting up hot reloading

Kill previous. Rerun DevServer. Refresh webpage.

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
  // config.plugins.push(new webpack.NamedModulesPlugin()); // enabled by mode
} else {
  // config.plugins.push(new webpack.HashedModuleIdsPlugin());
  // config.plugins.push(new webpack.NamedModulesPlugin());
}
```

## Test hot reloading

Kill previous `ctr+c`. Rerun DevServer. Refresh webpage.

Enter something in input field (the one that has placeholder *Text Here*) using browser.

Change something in SCSS

_src/index.global.scss_

```scss
  transform: translateY(70px);
```

and save file.

Now the page itself does not reload, only SCSS. And text you entered in input field is still there. *State* is kept! Hot!

Now kill `ctrl+c` devserver. 

## Disabling MiniCssExtractPlugin for hot reloading CSS

When running dev server we actually want CSS to be inlined within JavaScript so that hot reloading works better. Which will result in `404` for `assets/index.css` and FOUC, but it is ok for development.

We have it already going in _webpack.config.js_ as *MiniCssExtractPlugin* falls back to `style-loader` when on development.

## Changing port numbers based on environment / mode in `index.html` automatically

Remember that at this stage you would have to remove `4000` from assets referenced in `index.html` manually to see testing results, as then all files are outputted in real filesystem and served by nginx (port `80`). This is inconvenient. How about building *HTML* so that it automatically sets those port numbers for us based on build target? See that in next section.

---
# Use npm `scripts`!
---

It is hard to remember all the commands that need to be executed to run stuff. Therefore always make shortcuts. IMHO `package.json` scripts section should reflect what this package can do!

We 

* add `scripts` key to `package.json`
* add `config` key to `package.json` and use those values both in `scripts` within `package.json` itself as well as in `webpack.config.js`

By doing so

* `npm run build:front:dev` to run development tier
* `npm run build:front:test` to run testing tier (which in this case sets webpack to *production mode*, but still on local machine)

Check source of this section to see

* new keys `config` and `scripts` in `package.json`
* how `sripts` can relate to `config` values within `package.json` itself by using `$npm_package_*`
* how `config` values are used in `webpack.front.config.js`, by loading values in `pConfig` object and using it throughout the webpack config file

---
# Next
---

Dynamic HTML building will cover how HTML building could be automated.
