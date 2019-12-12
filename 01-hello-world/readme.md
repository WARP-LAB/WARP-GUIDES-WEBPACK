# webpack says *Hello World*

---
# In this section

* OS requirements
* Project structure
* 4-tier system
* Basic config
* Loading JavaScript
* Minimising JavaScript
* Copying files from source to public without compiling
* Loading CSS and SCSS
* Scope hoisting
* Define plugin
* Notes on other loaders
* npm scripts

---
# Preflight

## OS requirements

This assumes development on any of these

- BSD/*nix.
- Microsoft Windows where you do all this in POSIX shell, because of [WSL](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux) installed.
- macOS (and this tut is actually written on this OS).

Btw, if one has to switch back and forth between POSIX and MSW command prompt while working on project, then using [cross-env](https://www.npmjs.com/package/cross-env) is a must (but again, when on MSW you should use WSL POSIX shell, don't use *command promt*).

## Set up basic dir structure

Crate master directory and set files tree up like this.  
Leave all files empty, we will fill them step by step.  

```
webpacktest-01-hello-world
├── package.json
├── public
│   ├── assets
│   └── index.html
├── src
│   ├── fonts
│   ├── helpers
│   │   ├── helpers.lazy.js
│   │   ├── helpers.lazy.scss
│   │   └── helpers.simple.js
│   ├── html
│   │   └── index.template.ejs
│   ├── images
│   ├── index.global.scss
│   ├── index.js
│   ├── index.legacy.css
│   ├── index.local.scss
│   ├── preflight
│   │   ├── preflight.css
│   │   └── preflight.js
│   ├── section.global.scss
│   ├── section.js
│   ├── section.local.scss
│   ├── sw.js
│   └── typography.global.scss
└── webpack.front.config.js
```

## npm

Either leave `package.json` out and generate it using `npm init` or put simple template `package.json` in place / [manually fill in](https://docs.npmjs.com/files/package.json) bare minimum yourself.

_package.json_

```json
{
  "name": "webpacktest-01-hello-world",
  "version": "1.0.0",
  "description": "webpack testing",
  "main": "public/index.html",
  "author": "kroko",
  "license": "MIT",
  "private": true
}
```

## Server side

This *Hello World* (and further examples) does not necessarily need serverside.

Opening `index.html` directly from filesystem in browser will work just fine if *asset paths* (JS, CSS, font, image, etc. files), as they are referenced from `index.html` and/or JavaScript & CSS files, are specified with correct relative paths to the referer.

The one serverside that will be needed once we get to *webpack-dev-server* will be supplied by *webpack* itself - *webpack-dev-server* fires up Node.js server and will serve files at `http://localhost:<port>/`. In that case there will be an option to also serve `index.html` and access it through FQDN.

Note that there might be cases though where one may need to allow browser to load resources from local filesystem, for example webfonts.

However if one has webserver running that is able to serve static files, let it serve `public` directory from chapters. That would be serving `webpacktest-<chapter>/public` as *webroot*  (in case of *Hello World* serving `webpacktest-01-hello-world/public` as *webroot*).

A nice tool for that is [Valet Linux](https://cpriego.github.io/valet-linux/), [Valet WSL](https://github.com/valeryan/valet-wsl)(in progress) or [Laravel Valet](https://laravel.com/docs/5.7/valet).  
*Valet* has nothing to do with *Laravel* or *PHP* in this case. It supplies *nginx* that serves files from `anydirectory/public` within its [*park*](https://laravel.com/docs/6.x/valet#the-park-command) directory and sets up *DnsMasq*, so that all directories within *park* (more precisely - `public` directories within) are automatically served as `http(s)://directoryname.test`.  
Practical example - if one copies `webpacktest-01-hello-world` (and in the future `webpacktest-<sectionname>`) in a directory where *Valet* is parked, then the chapter code can be accessed using `http(s)://webpacktest-01-hello-world.test` in browser, where `webpacktest-01-hello-world/public` directory contents are served, `index.html` is *autoindexed*.  
Although *Valet* is not a requirement for this tut, it is really handy.

---
# Vanilla JavaScript first build

Note for [absolute beginners](https://www.youtube.com/watch?v=r8NZa9wYZ_U). All npm as well as webpack commands are executed while being `cd`-ed in the chapter's code directory. There is possibility to do `npm --prefix ...` though. RTFM@NPM / ask.


## Install webpack

Install webpack and save to dev dependencies

```sh
cd webpacktest-01-hello-world
npm install webpack --save-dev
npm install webpack-cli --save-dev
```

## First configuration

### webpack configuration file

Filling in webpack configuration file. ES6 / ES2015 should be used in webpack config files.

_webpack.front.config.js_

```javascript
// webpack config file

'use strict';

const path = require('path');

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
// Setup log
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToApp', appPathUrlBuildRelativeToApp);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToServerRoot', appPathUrlBuildRelativeToServerRoot);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ----------------
// BASE CONFIG
let config = {
  mode: 'development',
  context: __dirname,
  entry: {
    index: [
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: appPathFsBuild,
    publicPath: appPathUrlBuildRelativeToApp,
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src/'),
      'node_modules',
      'bower_components'
    ],
    alias: {
      extras: path.resolve(__dirname, 'src/helpers/')
    }
  }
};

module.exports = config;

```

### Basic HTML and JavaScript

_public/index.html_

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
  <link href="assets/index.css" rel="stylesheet" type="text/css">
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
  <script src="assets/index.js"></script>
</body>
</html>
```

Setting up *Hello World* JavaScript that selects `app` div in DOM and puts some text in it. Note that ES5 is used here and will be until [Babel](https://babeljs.io) is attached to the pipe, except for `require()`.

_src/index.js_

```javascript
// index.js

'use strict';

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
div.innerHTML += '<label for="textfield">Enter your text</label>';
div.innerHTML += '<input id="textfield" type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
```

### Building

Running webpack (clean assets directory before).  
Note that further below instead of accessing local `node_modules` bin manually to call `webpack`, [`npx`](https://github.com/npm/npx) will be used (and bit later *npm scripts* will be introduced).

```sh
rm -rf $(pwd)/public/assets/** && \
$(pwd)/node_modules/webpack/bin/webpack.js --config=$(pwd)/webpack.front.config.js --progress
```
After running webpack `public/assets` directory contains the product just built - `index.js`.

Open `index.html` directly in the browser from filesystem. JavaScript should be running and thus one should see *Hello JS* greeting in rendered HTML. Ignore `404`s in browser's console for other JS and CSS files for now.

### Entry key naming

Entry object key names in *webpack.front.config.js* dictate what will be the outputted filename in `public/assets`. That is if one changes entry object key name, which currently is set to `index` to say`myBundleName`

_webpack.front.config.js_

```javascript
  entry: {
    myBundleName: [
      path.resolve(__dirname, 'src/index.js')
    ]
  },
```

then `public/assets/` will hold `myBundleName.js` instead of `index.js`.  
Later one will observe that CSS that is imported through JavaScript also will be built by default as the entry point name dictates, i.e., `public/assets/index.css`.

One can change this behaviour in `config.output.filename` which currently is set to `'[name].js'` as decribed [here](https://webpack.js.org/configuration/output/#outputfilename).  
Eventually this tutorial will have multiple entry points, cunking and hashing. Let the entry point key name manage the output name, using `[substitutions]`.

---
# Webpack mode, deploy tiers and environments (`NODE_ENV`)

webpack 4 [introduced modes](https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a).

See [documentation here](https://webpack.js.org/configuration/mode/).

Although webpack has 2 modes (technically 3 as there is `none` mode) this tutorial (manually) sets up base for [4-tier deployment](https://en.wikipedia.org/wiki/Deployment_environment#Architectures). This will be done via environment variable `NODE_ENV`.

Examples of passing `NODE_ENV` depicting tier to webpack:

```sh
NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=testing npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=staging npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

And using them in *webpack.front.config.js*

_webpack.front.config.js_

```javascript
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

// ...

// ----------------
// Setup log
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToApp', appPathUrlBuildRelativeToApp);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToServerRoot', appPathUrlBuildRelativeToServerRoot);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ...

let config = {
  mode: development ? 'development' : 'production',
  // ...  
};

// ...

```

In this guide we will put webpack in *development mode* when in development tier and in *production mode* when in any other (non-development) tiers. *Testing* tier throughout this guide can be considered as production tier.

Run webpack, specify `NODE_ENV` value

*development*

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

*testing*

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Inspecting the built `assets/index.js` in both cases one should observe that in *testing* case `assets/index.js` is minimised, webpack *zero config* features are kicking in.

---
# JavaScript modules and webpack resolve alias

## Requiring JavaScript modules

Edit `src/helpers/helpers.simple.js` which will serve as simple JavaScript module.

_src/helpers/helpers.simple.js_
 
```javascript
// helpers.simple.js

module.exports = {
  helperA: function () {
    console.log('I am simple helper A');
  },
  helperB: function () {
    console.log('I am simple helper B');
  }
};
```

Edit `src/index.js`

_src/index.js_

```javascript
// index.js

'use strict';

var helpers = require('helpers/helpers.simple.js');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
div.innerHTML += '<label for="textfield">Enter your text</label>';
div.innerHTML += '<input id="textfield" type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();
```

Build

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Refresh `index.html` and observe browser console outputting *I am simple helper A*.

## Note on resolving aliases

*Extras*? Line in *src/index.js*

```javascript
var helpers = require('extras/helpers.simple.js');
```

works (finds and requires the module within `src/helpers/helpers.simple.js`) because resolve alias `extras` is defined.

It could be also written as

```javascript
var helpers = require('./helpers/helpers.simple.js');
```

and it will work - using relative path is allowed (in this case from `index.js` to `helpers.simple.js`). 

The point of this example is - use aliases. That allows changing directory structure of the app, one would just have to change where alias are pointing to in `webpack.front.config.js`, there would be no need to change actual app JavaScript code. That also allows avoiding the traversing of the file system up and down within the JavaScript `require()` statements.

---
# Minimise JavaScript with custom options

When buiilding webpack for testing tier then minimisation in action can be seen as setting `mode` to production autoenables *TerserPlugin* that uses [terser](https://github.com/terser/terser) for minification (previously it was *UglifyJsPlugin* which uses [UglifyJS](https://github.com/mishoo/UglifyJS2)), [see docs](https://webpack.js.org/concepts/mode/).

In other words, on *production* mode webpack sets `optimization.minimize: true` and `optimization.minimizer: new TerserPlugin({})` with some defaults.

But what if those defaults needs some overrides? Just pass custom constructed object to `optimization.minimizer`.

`TerserPlugin` keys can be found [here](https://webpack.js.org/plugins/terser-webpack-plugin/).  
`terserOptions` key can be found [here](https://github.com/terser/terser#minify-options) and it holds also links to options for `terserOptions.parse`, `terserOptions.compress`, `terserOptions.mangle`, `terserOptions.output`, and `terserOptions.sourceMap` objects.

Install plugin

```sh
npm install terser-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...

const TerserPlugin = require('terser-webpack-plugin');

// ...

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: true, // can override
  minimizer: [
    new TerserPlugin({
      test: /\.js(\?.*)?$/i,
      // include: '',
      // exclude: '',
      chunkFilter: (chunk) => { return true; },
      cache: true,
      cacheKeys: (defaultCacheKeys, file) => { return defaultCacheKeys; },
      parallel: true,
      sourceMap: false,
      // minify: (file, sourceMap) => {},
      // warningsFilter: (warning, source, file) => { return true; },
      extractComments: false,
      warningsFilter: (warning, source, file) => { return true; },
      terserOptions: {
        // ecma: undefined,
        warnings: true,
        parse: {},
        compress: {},
        mangle: false,
        module: false,
        output: {
          comments: true
        },
        sourceMap: false,
        toplevel: false,
        nameCache: null,
        ie8: false,
        keep_classnames: undefined,
        keep_fnames: false,
        safari10: false
      }
    })
  ]
};

// ...
```

As an simple example of options taking effect build for testing tier

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

and observe `assets/index.js` file contents.

Change terser option for comments.

_webpack.front.config.js_

```javascript
// ...
      terserOptions: {
        // ...
        output: {
          comments: false
        },
        // ...
      }
// ...
```

Build again for testing tier and observe.

---
# Manually copy files over to destination

`index.html` file has `preflight.js` and `preflight.css` referenced in the head. But they are not present in output directory after building webpack, thus rendering `index.html` will greet with *Hello World*, but console we probably yield `404` for *preflight* assets (and also *index.css*, but more on that later as currently there is no CSS at all).

Consider *preflight* assets as a special case - webpack should not attached *webpack stuff* to it. Webpack *stuff*? Build the project for development (thus no minimising) and inspect `public/assets/index.js`. *That webpack stuff.* Later there will also other *stuff*, i.e., runtime and manifest.

From the current tools that are available one approach would be to use [`copy-webpack-plugin`](https://github.com/webpack-contrib/copy-webpack-plugin) which is the popular one. We have used [`filemanager-webpack-plugin`](https://github.com/gregnb/filemanager-webpack-plugin) as *filemanager* allows specifying actions that are executed both before and/or after webpack begins the bundling process, but it has stalled in it's development.

```sh
npm install copy-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...
const CopyPlugin = require('copy-webpack-plugin');
// ...

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// Plugins as enabled OOB by webpack based on mode
// https://webpack.js.org/configuration/mode/
//
// development
// - NamedChunksPlugin
// - NamedModulesPlugin
//
// production
// - FlagDependencyUsagePlugin
// - FlagIncludedChunksPlugin
// - ModuleConcatenationPlugin
// - NoEmitOnErrorsPlugin
// - OccurrenceOrderPlugin
// - SideEffectsFlagPlugin
// - TerserPlugin
//
// none
// - none enabled

// ----------------
// CopyPlugin
config.plugins.push(new CopyPlugin([
  {
    from: path.join(__dirname, 'src/preflight/*.{js,css}'),
    to: appPathFsBuild,
    flatten: true,
    toType: 'dir'
  }
]));

```

_src/preflight/preflight.js_

```javascript
// PREFILIGHT HAS TO STAY ES3 COMPATIBLE
// Inline in head.
// This will pause HTML parsing and execute immediately.
// It changes preceding DOM.
// When we hit body CSS state machine will be already setup.

// ############################################################
// Change noscript to script.
document.documentElement.className = document.documentElement.className.replace(/\bnoscript\b/, 'script');

// ############################################################
// Change incapable to capable.
// Normally we try to deploy stuff that works on ES5-ish browsers.
// That means normally IE11+, but demands for archaic stuff occurs.
// As example this CTM will inform us via CSS state machine that we are IE10+.
if ('visibilityState' in document) {
  document.documentElement.className = document.documentElement.className.replace(/\bincapable\b/, 'capable');
}

// ############################################################
// Just say hello.
console.log('I am Preflight');
```

_src/preflight/preflight.css_

```css
/* Example of preflight CSS state machine */

.noscript {
  display: block;
  background-color: aqua;
}

.incapable {
  display: block;
  background-color: olive;
}

html.noscript .incapable { display: none; }

html.noscript .app { display: none; }

html.incapable .app { display: none; }

html.capable .incapable { display: none; }

html.script .noscript { display: none; }
```

Run webpack for testing tier

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

The *preflight* files are copied to `public/assets` directory. Open page in the browser, preflight JS does it's job of renaming classnames and prefligt CSS does it's job of of hiding that `Incabable :(` message.

The sole reason for *preflight* is to use some ES3 code without any polyfills that can execute on *any* browser for detecting very very very basic browser features, including JavaScript support, in order to set if the webapp can be run at all. It is not about which features to enable, granular feature detection and fallbacks can be done in actual app code using tools such as [*Modernzr*](https://modernizr.com). *preflight* should not be touched by webpack *compiling* system.

---
# SCSS/CSS setup

## Note on cssnext

Using [cssnext](http://cssnext.io) is not here yet...  
Sass it is.

## Sass and CSS loaders

### node-sass

For to compile SCSS to CSS [Node-sass](https://github.com/sass/node-sass) will be used. It _is a library that provides binding for Node.js to LibSass, the C version of the popular stylesheet preprocessor, Sass_.  

```sh
npm install node-sass --save-dev
```

### About loaders

[webpack documentation](https://webpack.js.org/loaders/)

### Set up loaders and plugins for Sass and CSS

A bunch of webpack loaders is needed to get that `index.css` working.

Loaders & documentation  
[style-loader](https://github.com/webpack-contrib/style-loader)  
[css-loader](https://github.com/webpack-contrib/css-loader)  
[sass-loader](https://github.com/webpack-contrib/sass-loader)  

Previously minification could be handled by `css-loader`, now a simple adition is [optimize-css-assets-webpack-plugin](https://github.com/NMFR/optimize-css-assets-webpack-plugin), which uses [cssnano](https://github.com/cssnano/cssnano). However it is a basic (and in this tut a temporary solution) as [PostCSS](https://postcss.org) will be used later where CSS optimisation will be solved differently.

Until webpack 4 [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) ([webpack docs](https://webpack.js.org/plugins/extract-text-webpack-plugin/)) was way to go.

However now [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) should be used as it is future proof.

`mini-css-extract-plugin` extracts required CSS from within JavaScript into separate file(s). Thus CSS is not inlined into the JavaScript (`public/assets/index.js`), which would be kind of default webpack way without this plugin.

```sh
npm install style-loader --save-dev
npm install css-loader --save-dev
npm install sass-loader --save-dev
npm install mini-css-extract-plugin --save-dev
npm install optimize-css-assets-webpack-plugin --save-dev
```

Set up loaders, set `mini-css-extract-plugin` to extract CSS if `!development` and set up temporary `optimize-css-assets-webpack-plugin`.

_webpack.front.config.js_

```javascript
// webpack config file

'use strict';

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // Use while PostCSS is not introduced

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
// Output filesystem path
const appPathFsBase = path.join(__dirname, 'public/'); // file system path, used to set application base path for later use
const appPathFsBuild = path.join(appPathFsBase, 'assets/'); // file system path, used to set webpack.config.output.path a.o. uses

// ----------------
// Output URL path
// File system paths do not necessarily reflect in URL paths, thus construct them separately
const appPathUrlBuildRelativeToApp = 'assets/'; // URL path for appPathFsBuild, relative to app base path
const appPathUrlBuildRelativeToServerRoot = `/${appPathUrlBuildRelativeToApp}`; // URL path for appPathFsBuild, relative to webserver root

// ----------------
// Setup log
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'TIER', tierName);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToApp', appPathUrlBuildRelativeToApp);
console.log('\x1b[44m%s\x1b[0m -> \x1b[36m%s\x1b[0m', 'appPathUrlBuildRelativeToServerRoot', appPathUrlBuildRelativeToServerRoot);
console.log('\x1b[42m\x1b[30m                                                               \x1b[0m');

// ----------------
// BASE CONFIG
let config = {
  mode: development ? 'development' : 'production',
  context: __dirname,
  entry: {
    index: [
      path.resolve(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: appPathFsBuild,
    publicPath: appPathUrlBuildRelativeToApp,
    filename: '[name].js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'src/'),
      'node_modules',
      'bower_components'
    ],
    alias: {
      extras: path.resolve(__dirname, 'src/helpers/')
    }
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
            sourceMap: true
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
            sourceMap: true
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true
          }
        }
      ],
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
      chunkFilter: (chunk) => { return true; },
      cache: true,
      cacheKeys: (defaultCacheKeys, file) => { return defaultCacheKeys; },
      parallel: true,
      sourceMap: false,
      // minify: (file, sourceMap) => {},
      // warningsFilter: (warning, source, file) => { return true; },
      extractComments: false,
      warningsFilter: (warning, source, file) => { return true; },
      terserOptions: {
        // ecma: undefined,
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
    new OptimizeCSSAssetsPlugin({}) // Use while PostCSS is not introduced
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// Plugins as enabled OOB by webpack based on mode
// https://webpack.js.org/configuration/mode/
//
// development
// - NamedChunksPlugin
// - NamedModulesPlugin
//
// production
// - FlagDependencyUsagePlugin
// - FlagIncludedChunksPlugin
// - ModuleConcatenationPlugin
// - NoEmitOnErrorsPlugin
// - OccurrenceOrderPlugin
// - SideEffectsFlagPlugin
// - TerserPlugin
//
// none
// - none enabled

// ----------------
// CopyPlugin
config.plugins.push(new CopyPlugin([
  {
    from: path.join(__dirname, 'src/preflight/*.{js,css}'),
    to: appPathFsBuild,
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
```

Require CSS in the entry.

_src/index.js_

```javascript
// index.js

'use strict';

var helpers = require('extras/helpers.simple.js');
require('index.global.scss');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
div.innerHTML += '<label for="textfield">Enter your text</label>';
div.innerHTML += '<input id="textfield" type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();
```

_src/index.legacy.css_

```css
@charset 'UTF-8';

/* This is example of vanilla CSS */

h1 {
  color: blue !important;
}
```

_src/index.global.scss_

```scss
@charset 'UTF-8';

// This is example of SCSS

@import 'index.legacy.css';

$mycolor: red;

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;
}
```

Run webpack for testing tier and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

SCSS and CSS is compiled and spit out in a file under `public/assets` named the same as the entry point key of the JavaScript from which SCSS was included in the first place. `index.legacy.css` was compiled into the output.

And *Hello World* in browser now has colours!

**Remember that if webpack is run for development tier then CSS would be actually inlined in `public/assets/index.js` and no `public/assets/index.css` would be generated.**

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=develpment \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

---
# Scope hoisting and module concatenation

This should belong to *Hello World* as the principle is important when using webpack. [Read here](https://webpack.js.org/plugins/module-concatenation-plugin/). As of webpack 4 it is by default on when in *production mode* [optimization.concatenateModules](https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a).

---
# Define plugin

Edit *src/index.js*

_src/index.js_

```javascript
// index.js

/* global __DEVELOPMENT__ */

'use strict';

var helpers = require('extras/helpers.simple.js');
require('index.global.scss');

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
div.innerHTML += '<label for="textfield">Enter your text</label>';
div.innerHTML += '<input id="textfield" type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();
```

Where is `__DEVELOPMENT__` coming from? Global inlined constants has place and use!  
[webpack.DefinePlugin](https://webpack.js.org/plugins/define-plugin/)  

Moreover as the values will be inlined into the code it will allows minification pass to remove the redundant conditional.

_webpack.front.config.js_

```javascript
// ...

const webpack = require('webpack');

// ...

// ----------------
// PLUGINS
config.plugins = [];

// ...

// ----------------
// DefinePlugin
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': (development) ? 'development' : 'production',
    'BROWSER': true
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEVTOOLS__: development,
  __DEV__: development,
  __PROD__: !development,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production
}));

// ...
```

`process.env.NODE_ENV` gets treatment where it is set to either `development` or `production` (thus 4 tier is *translated* to 2 tier) based on ENV testing logic done at the beginning of _webpack.front.config.js_. The reason is that libraries (*React* is a good example) use `process.env.NODE_ENV` in their code to do something like this

```javascript
if (process.env.NODE_ENV === 'development') {
  // do not optimize library, compile it for better debugging
} else {
  // optimize library, strip out all debugging stuff
}
```

or may use `__DEV__` and `__PROD__` constants.

Meanwhile user code still can use all 4 tiers in the logic by targeting using `__TIER_NAME__` just as in the example above.

Build for development and inspect console output as well as outputted file at `public/assets.index.js`

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```
Console yields `I'm in development!` as `__DEVELOPMENT__` is `true`. And `public/assets/index.js` file holds

```javascript
if (true) {
  console.log('I\'m in development!');
}
```

Build for testing tier and inspect outputted file at `public/assets/index.js`

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=testing \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

no `'I\'m in development!'` can be found as Terser removes unreachable code.

---
# npm scripts

For calling webpack `npx` was used.

```sh
rm -rf $(pwd)/public/assets/** && \
NODE_ENV=development \
npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Define some user [npm scripts](https://docs.npmjs.com/misc/scripts) that can be used as shorthand. Add key to _package.json_

_package.json_

```json
  "scripts": {
    "front:build:dev": "npm run clean:assets && NODE_ENV=development webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:test": "npm run clean:assets && NODE_ENV=testing webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:stage": "npm run clean:assets && NODE_ENV=staging webpack --config=$(pwd)/webpack.front.config.js --progress",
    "front:build:prod": "npm run clean:assets && NODE_ENV=production webpack --config=$(pwd)/webpack.front.config.js --progress",
    "clean:assets": "rm -rf $(pwd)/public/assets/**"
  },
```

Now `npm run` can be used to call different tier builds.

```sh
npm run front:build:dev
npm run front:build:test
# ...
```

---
# Result

See `webpacktest-01-hello-world` directory.

---
# Next

We will look at PostCSS as well as file (fonts, images) loading using webpack.