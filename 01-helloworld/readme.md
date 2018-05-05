# webpack says *Hello World*

---
# In this section
---

* Basics
* Scope hoisting
* Notes on other loaders

---
# Preflight
---

## Set up basic dir structure

Crate master directory and set files tree up like this (`tree -a .`).  
Leave all files empty, we will fill them up step by step.  

```
webpacktest-basic
├── package.json
├── public
│   ├── assets
│   └── index.html
├── src
│   ├── fonts
│   ├── helpers
│   │   ├── helpers.lazy.js
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
│   └── typography.global.scss
└── webpack.front.config.js
```

Leave `webpack.front.config.js`, javascript, EJS and CSS/SCSS files empty for now. 

## npm

Either leave `package.json` out and generate it using `npm init` or put simpe template `package.json` in place / [manually fill in](https://docs.npmjs.com/files/package.json) bare minimum yourself.

_package.json_

```json
{
  "name": "webpacktest-helloworld",
  "version": "1.0.0",
  "description": "webpack testing",
  "main": "public/index.html",
  "author": "kroko",
  "license": "MIT",
  "private": true
}
```

## Server side

Remember that this *Hello World* does not necessarely need any webserver. Opening `index.html` directly from filesystem will work just fine in most cases.

However following sections will assume some server side because of file serving (you really should not be doing `--allow-file-access-from-files`) and to actually reflect on real development process. If not using webserver paths will break.

The guide is written by having directory `webpacktest-helloworld` (and in the future `webpacktest-<sectionname>`) in a directory where [*Laravel Valet*](https://laravel.com/docs/5.5/valet) is parked. *Valet* has nothing to do with *PHP* in this case, it just gives us *nginx* (that serves files from `anydirectory/public` within its park directory OOB) and *DnsMasq*, so that when `webpacktest-helloworld` directory is parked, it can be accessed via `//webpacktest-helloworld.test` domain. Although *Valet* is not requirement, it is really handy!

Options

* If doing this locally having `nginx` then `public` directory from the directory structure described above should be served (web root).
* If doing this locally via Node, then put the directory structure wherever.
* If doing this locally within container (Docker) or VM (Vagrant/whatever), then put where needed
* If doing this on our devserver `devisites` pool, `public` is webroot, served at `nameformywebpacktest.our.dev.host.tld`.

---
# Vanilla JavaScript and SCSS/CSS setup
---

*Note for [absolute beginners](https://www.youtube.com/watch?v=r8NZa9wYZ_U). All `npm` as well as `webpack` commands are executed while being `cd`-ed in this projects 'master directory'. You can do it while being somewhere else via `npm --prefix ${DIRNAME} install ${DIRNAME}` though. RTFM@NPM / ask.*


## Install webpack

Install webpack and save to dev dependencies

```sh
npm install webpack --save-dev
npm install webpack-cli --save-dev
```

## First configuration

Fill in webpack configuration file. Please always use ES6 in webpack config files.

_webpack.front.config.js_

```javascript
'use strict';
const path = require('path');

// ----------------
// Output public path
const outputPublicPath = '/assets/';

// ----------------
// Output fs path
const outputPath = path.join(__dirname, 'public/assets');

let config = {
  mode: 'development',
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
    publicPath: outputPublicPath,
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
module.exports = config;
```

### Fill in basic HTML, JS

*public/index.html*

```html
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title>My Title</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <script src="./assets/preflight.js"></script>
  <link href="./assets/preflight.css" rel="stylesheet" type="text/css">
  <link href="./assets/index.css" rel="stylesheet" type="text/css">
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
  <script async src="./assets/index.js"></script>
</body>
</html>
```

Set up hello world javascript that selects `app` div in our html and puts some text in it. Note that we are using ES5 here.

_src/index.js_

```javascript
'use strict';
var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p><input type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
```

Run webpack (before that clean assets directory)

```sh
rm -rf $(pwd)/public/assets/** && $(pwd)/node_modules/webpack/bin/webpack.js --config=$(pwd)/webpack.front.config.js --progress
```

Inspect `public/assets` directory. Open `index.html` directly in the browser from filesystem.

Further below instead of accessing local `node_modules` bin manually, we will use [`npx`](https://github.com/zkat/npx)

Notice, that entry point __key names__ dictate what will be the outputted __filename__ in `./public/assets`. That is, you can change key name and real file name to whatever, i.e.,

```javascript
entry: {
  myBundle: './src/whatever.js'
},
```

and you will get `myBundle.js` in `./public/assets` (later you will see that CSS that is imported through JavaScript also will be named as the entry point name, i.e., `./public/assets/myBundle.css`).

You can change this behaviour if output `filename: '[name].js'` is set to `filename: 'someConstantName.js'`.  
But don't do that, let your entry point key name define the output name.  
Think of what would happen if you had multiple entry points (just like in a real world scenario). How would you manage filenames then if output file would not somehow depend on entry point, but would be always constant? Also later on when we get to chunking up webpack one entry point will produce multiple outputs.

## Webpack mode and environments (`NODE_ENV`)

webpack 4 [introduced modes](https://medium.com/webpack/webpack-4-mode-and-optimization-5423a6bc597a).

However, when running webpack we should specify what environment we are building it for as usually it is 4-tier. We will do this by specifying environment via `NODE_ENV`. This assumes development on macOS, which is officially certified as compliant with the Unix 03 / POSIX standard, or other BSD/*nix. But if one has to switch back and forth between POSIX and MSW while working on project, then using [cross-env](https://www.npmjs.com/package/cross-env) is a must!

Examples of passing NODE_ENV to webpack:

```sh
NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=testing npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=staging npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

and using them in _webpack.front.config.js_

```javascript
// ...

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('GLOBAL ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ...

mode: development ? 'development' : 'production',

// ...

```

Run webpack, specify `NODE_ENV` value

*production*

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

*development*

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Inspect the outputted `assets/index.js` in both cases.


---
# Requiring JS
---

Just as we required CSS

Edit `src/helpers/helpers.simple.js`
 
```javascript
module.exports = {
  helperA: function () {
    console.log('I am simple helper A');
  },
  helperB: function () {
    console.log('I am simple helper B');
  }
};
```

Edit *index.js*

```javascript
'use strict';

var helpers = require('./helpers/helpers.simple.js');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p><input type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();
```

Build and observe.

## Webpack minimise JavaScript

If you built webpack for production then you already saw that minimisation in action as setting `mode` to production autoenables *UglifyJsPlugin* [see docs](https://webpack.js.org/concepts/mode/).

On production webpack sets `optimization.minimize: true` and `optimization.minimizer: new UglifyJsPlugin()` with some defaults.

But what if it has defaults we migth want to change? For example defaults dont drop console calls (note that here we will also explicitly keep it for debug purposes). We just pass our custom constructed object to `optimization.minimizer`.

For JavaScript minimisation we can use webpack plugin [uglifyjs-webpack-plugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/). It is uses [UglifyJS 3](https://github.com/mishoo/UglifyJS2) under the hood and thus supports ES6+ (the plugin is now based on `uglify-es` (which in turn is the result of previosusly so called *UglifyJS harmony branch*)).

Options for `compress` key can be [found here](http://lisperator.net/uglifyjs/compress)  
Other keys [here](https://github.com/webpack-contrib/uglifyjs-webpack-plugin#options)

Install plugin

```sh
npm install uglifyjs-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

// ...

// ----------------
// OPTIMISATION

config.optimization = {
  // config.optimization.minimize = true, // can override
  minimizer: [
    new UglifyJsPlugin({
      cache: true,
      parallel: true,
      uglifyOptions: {
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: false,
          warnings: true
        },
        ecma: 6,
        mangle: false,
        warnings: true,
        output: {
          comments: false,
          beautify: false
        },
      },
      extractComments: false,
      sourceMap: false
    })
  ]
};

// ...
```

## Manually copy files over to destination

Our `index.html` file has `preflight.js` and `preflight.css` referenced in the head. But they are not present in output directory after building webpack, thus opening `index.html` directly in the browser from filesystem will greet *Hello World*, but checking console we will probably show `404` for those assets (and also *index.css*, but more on that later as we currently have no CSS at all).

Let us consider these assets as a special case where we want to avoid any webpack stuff to be attached to it (runtime and manifest, more on that later). What do I mean by webpack stuff? Build the project once again for development (no minimising) and inspect `public/assets/index.js`. *That webpack stuff.*

From the current tools that are available one approach would be to use `copy-webpack-plugin` which is quite popular (and you can use it for this purpose), however we will be using `filemanager-webpack-plugin` as *filemanager* allows specifying actions that are executed both before and/or after webpack begins the bundling process.

```sh
npm install filemanager-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...
const FileManagerPlugin = require('filemanager-webpack-plugin');
// ...

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// FileManagerPlugin

config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      {
        source: path.join(__dirname, 'src/preflight/*.{js,css}'),
        destination: outputPath
      }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));
// ...
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
// That means normaly IE11+, but sometimes even down to IE9, although that denies usage of many nice tools.
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

Run webpack

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

The files are in `public/assets` directory. Open page in the browser, preflight JS does it's job of renaming classnames and prefligt CSS does it's job of of hiding that `Incabable :(` message.

The sole reason for preflight is to use some ES3 code without any polyfills (in production actualy preflight script is inlined in template) that can execute on *any* browser for detecting very very very basic browser features, including JavaScript support, in order to set if the webapp can be run at all. It is not about which features to enable, granual feature detection and fallbacks can be done in actual app code using tools such as *Modernzr*.

## Note on cssnext

Using [PostCSS and the cssnext](http://cssnext.io) is not here yet...  
Sass.

## Sass and CSS loaders

### node-sass

For to compile SCSS to CSS we will be using [Node-sass](https://github.com/sass/node-sass). It _is a library that provides binding for Node.js to LibSass, the C version of the popular stylesheet preprocessor, Sass_.  

```sh
npm install node-sass --save-dev
```

### loaders

We need a bunch of webpack loaders to get that `index.css` working that is 404'ed when running our `index.html`.

Loaders & documentation  
[https://github.com/webpack-contrib/style-loader](https://github.com/webpack-contrib/style-loader)  
[https://github.com/webpack-contrib/css-loader](https://github.com/webpack-contrib/css-loader)  
[https://github.com/webpack-contrib/sass-loader](https://github.com/webpack-contrib/sass-loader)  

Until webpack 4 [extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin), [webpack docs](https://webpack.js.org/plugins/extract-text-webpack-plugin/) was (and still is) way to go. However now we should use [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) as it is future proof.

`mini-css-extract-plugin` extracts required CSS within JavaScript into separate files. Thus your styles are not inlined into the JavaScript (which would be kind of default webpack way without this plugin), but separate in a CSS file `entryPointKeyName.css` (and even chunked).

```sh
npm install style-loader --save-dev
npm install css-loader --save-dev
npm install sass-loader --save-dev
npm install mini-css-extract-plugin --save-dev
```

Set `mini-css-extract-plugin` to extract CSS if `!development`.

_webpack.front.config.js_

```javascript
'use strict';
const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('GLOBAL ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Output public path
const outputPublicPath = '/assets/';

// ----------------
// Output fs path
const outputPath = path.join(__dirname, 'public/assets');

let config = {
  mode: development ? 'development' : 'production',
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
    publicPath: outputPublicPath,
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
            minimize: false,
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
            minimize: false,
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
  // config.optimization.minimize = true, // can override
  minimizer: [
    new UglifyJsPlugin({
      cache: true,
      parallel: true,
      uglifyOptions: {
        compress: {
          sequences: true,
          dead_code: true,
          conditionals: true,
          booleans: true,
          unused: true,
          if_return: true,
          join_vars: true,
          drop_console: false,
          warnings: true
        },
        ecma: 6,
        mangle: false,
        warnings: true,
        output: {
          comments: false,
          beautify: false
        },
      },
      extractComments: false,
      sourceMap: false
    })
  ]
};

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// FileManagerPlugin
config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      {
        source: path.join(__dirname, 'src/preflight/*.{js,css}'),
        destination: outputPath
      }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: '[name].css',
  chunkFilename: '[id].css',
}));

module.exports = config;
```

_src/index.js_

```javascript
'use strict';

var helpers = require('./helpers/helpers.simple.js');
require('./index.global.scss');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p><input type="text" name="testtext" placeholder="Text Here">';
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

@import 'index.legacy.css';

$mycolor: red;

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;
}
```

Run webpack and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

SCSS and CSS is compiled and spit out in a file under `public/assets` named the same as the entry point key of the JavaScript from which SCSS was included in the first place. See how `index.legacy.css` was compiled into the output.

And *Hello World* in browser now has colours!

---
# Scope hoisting w/ ModuleConcatenationPlugin
---

This should belong to *Hello World* as it is so important when using webpack. [Read here](https://webpack.js.org/plugins/module-concatenation-plugin/).

_webpack.front.config.js_

```javascript
// ...
const webpack = require('webpack');

// ...

// ----------------
// ModuleConcatenationPlugin
config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

```

---
# Define plugin
---

Edit *index.js*

```javascript
/* global __DEVELOPMENT__ */
'use strict';

require('./index.global.scss');
var helpers = require('./helpers/helpers.simple.js');

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p><input type="text" name="testtext" placeholder="Text Here">';
console.log('Hello JS!');
helpers.helperA();
```

Where is `__DEVELOPMENT__` coming from? Global inlined constants has place and use!  
[webpack.DefinePlugin](https://webpack.js.org/plugins/define-plugin/)  

Moreover as the values will be inlined into the code it will allows minification pass to remove the redundant conditional.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// DefinePlugin
config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
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


// ...
```

Build for development and inspect console output as well as outputted file at `public/assets.index.js`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```
Console says `I'm in development!` as `__DEVELOPMENT__` is `true`. And outputted file has unrolled the constant

```javascript
if (true) {
  console.log('I\'m in development!');
}
```

Build for production and inspect outputted file at `public/assets.index.js`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

no `'I\'m in development!'` can be found because we told UglifyYS to remove unreachable code.

```javascript
if (false) {
  console.log('I\'m in development!'); // <--this is unreachable, so remove it
}
```

---
# Next
---

We will look at PostCSS as well as file (fonts, images) loading using webpack.