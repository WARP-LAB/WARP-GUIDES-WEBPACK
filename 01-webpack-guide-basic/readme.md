# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# PREFLIGHT
---

## SET UP BASIC FILES & DIR STRUCTURE

Crate master directory and set files tree up like this (`tree -a .`).  
Leave all files empty, we will fill them up step by step.  
Remember

* if doing this locally via `nginx`, public should be served
* if doing this locally via Node, then put this wherever
* if doing this locally within container (Docker) or VM (Vagrant/whatever), then put where needed
* if doing this on our devserver `devisites` pool, `public` is `DocumentRoot`, served at `nameformywebpacktest.our.dev.host.tld`.
* if doing this on Docker container that is within VM that itself lies within LXC container within our devserver, then take a break

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

Leave `webpack.front.config.js`, javascript, EJS and CSS/SCSS files empty for now. Either leave `package.json` out and generate it in the next step (`npm init`) or put simpe template `package.json` in place / [manually fill in](https://docs.npmjs.com/files/package.json) bare minimum yourself.

_package.json_

```json
{
  "name": "webpacktest-basic",
  "version": "1.0.0",
  "description": "webpack testing",
  "main": "public/index.html",
  "author": "kroko",
  "license": "MIT",
  "private": true
}
```

## NPM INIT

`cd` in master directory and initialise npm in it. Not needed if you have placed template or DIY `package.json` already there.

```sh
npm init
```

---
# Vanilla JavaScript and SCSS/CSS setup
---

*Note for [absolute beginners](https://www.youtube.com/watch?v=r8NZa9wYZ_U). All `npm` as well as `webpack` commands are executed while being `cd`-ed in this projects 'master directory'. You can do it while being somewhere else via `npm --prefix ${DIRNAME} install ${DIRNAME}` though. RTFM@NPM / ask.*

## Set up webpack so that we can simply build JavaScript file

Install webpack and save to dev dependencies

```sh
npm install webpack --save-dev
```

Fill in webpack configuration file. Please always use ES6 in webpack config files.

_webpack.front.config.js_

```javascript
'use strict';
const path = require('path');

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

let config = {
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
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

Set up hello world javascript that selects `app` div in our html and puts some text in it. Note that we are using ES5 here.

_src/index.js_

```javascript
'use strict';
var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
console.log('Hello JS!');
```

Run webpack (before that clean assets directory)

```sh
rm -rf $(pwd)/public/assets/** && $(pwd)/node_modules/webpack/bin/webpack.js --config=$(pwd)/webpack.front.config.js --progress
```

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
Think of what would happen if you had multiple entry points (just like in a real world scenario). How would you manage filenames then if output file would not somehow depend on entry point, but would be always constant?  
And yeah, we will not discuss filename based versioning (cache busting) stuff in this tut.


## Webpack environments (`NODE_ENV`)

When running webpack we should specify what environment we are building it for. Let us assume simple 4-tier. We will do this by specifying environment via `NODE_ENV`. This assumes development on BSD/*nix, but if one has to switch back and forth between MSW  and POSIX, then use [cross-env](https://www.npmjs.com/package/cross-env) package!

```sh
NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=testing npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=staging npx webpack --config=$(pwd)/webpack.front.config.js --progress
NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```


## Webpack minimise JavaScript

For JavaScript minimisation we can use webpack built in plugin which actually uses [UglifyJS](https://github.com/mishoo/UglifyJS2) under the hood.

For built in plugin documentation the standalone docs can be used - [uglifyjs-webpack-plugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/)

Standalone plugin documentation [uglifyjs-webpack-plugin](https://webpack.js.org/plugins/uglifyjs-webpack-plugin/) and [git repo](https://github.com/webpack-contrib/uglifyjs-webpack-plugin)

Options for `compress` key can be [found here](http://lisperator.net/uglifyjs/compress)  
Other keys [here](https://github.com/webpack-contrib/uglifyjs-webpack-plugin#options)

Note that in Webpack 3 it is not aliased to `webpack.optimize.UglifyJsPlugin` (read docs).

Install plugin

```sh
npm install uglifyjs-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
'use strict';
const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin'); // aliasing this back to webpack.optimize.UglifyJsPluginis is scheduled for webpack v4.0.0

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

// ----------------
// BASE CONFIG
let config = {
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
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
// PLUGINS
config.plugins = []; // add new key 'plugins' of type arrat to config object

if (production) {
  config.plugins.push(new UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
      compress: {
        warnings: false
      }
    }
  }));
}

module.exports = config;
```

Run webpack, specify `NODE_ENV` value

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Inspect how `assets/index.js` changes based on whether `NODE_ENV` is set to `production` or `development`.

## Manually copy files over to destination

Our `index.html` file has `preflight.js` and `preflight.css` referenced in the head which is not present after building webpack (and we get `404`). However here let us not use `entry` stuff, simply copy it over to `output`.

From the current tools that are available one approach would be to use `copy-webpack-plugin` which is quite popular (and you can use it for this purpose), however we will be using `filemanager-webpack-plugin` as *filemanager* allows specifying actions that are executed before webpack begins the bundling process.

```sh
npm install filemanager-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...
const FileManagerPlugin = require('filemanager-webpack-plugin');
// ...
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
'use strict';

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

Inspect. The files are in `public/assets` directory. Run the app in the browser, JS does it's job of renaming classnames and CSS does it's job of of hiding those `noscript` and `incabable` containers.


## Webpack CSS loaders so that CSS/SCSS can be required in JavaScript

### node-sass

For to compile SCSS to CSS we will be using [Node-sass](https://github.com/sass/node-sass). It _is a library that provides binding for Node.js to LibSass, the C version of the popular stylesheet preprocessor, Sass_.  

```sh
npm install node-sass --save-dev
```

### loaders

We need a bunch of webpack loaders for this to work and to get that `index.css` working that is ref'ed in the `<head>`.

Loaders and their documentation  
[https://github.com/webpack-contrib/style-loader](https://github.com/webpack-contrib/style-loader)  
[https://github.com/webpack-contrib/css-loader](https://github.com/webpack-contrib/css-loader)  
[https://github.com/webpack-contrib/sass-loader](https://github.com/webpack-contrib/sass-loader)  

Plugin and its documentation  
[https://webpack.js.org/plugins/extract-text-webpack-plugin/](https://webpack.js.org/plugins/extract-text-webpack-plugin/)  

[extract-text-webpack-plugin](https://github.com/webpack/extract-text-webpack-plugin) moves every `require('style.css')` within JavaScript that is spilled out in chunks into a separate CSS output file. So your styles are not inlined into the JavaScript (which would be kind of default webpack way without this plugin), but separate in a CSS bundle file `entryPointKeyName.css`.

```sh
npm install style-loader --save-dev
npm install css-loader --save-dev
npm install sass-loader --save-dev
npm install extract-text-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
'use strict';
const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin'); // aliasing this back to webpack.optimize.UglifyJsPluginis is scheduled for webpack v4.0.0

// ----------------
// ENV
const development = process.env.NODE_ENV === 'development';
const testing = process.env.NODE_ENV === 'testing';
const staging = process.env.NODE_ENV === 'staging';
const production = process.env.NODE_ENV === 'production';
console.log('ENVIRONMENT \x1b[36m%s\x1b[0m', process.env.NODE_ENV);

// ----------------
// Output path
const outputPath = path.join(__dirname, 'public/assets');

// ----------------
// BASE CONFIG

let config = {
  context: __dirname,
  entry: {
    index: [
      path.join(__dirname, 'src/index.js')
    ]
  },
  output: {
    path: outputPath,
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
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          'css-loader?sourceMap'
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          'css-loader?sourceMap',
          'sass-loader?sourceMap'
        ]
      })
    }
  ]
};

// ----------------
// PLUGINS

config.plugins = [];


if (production) {
  config.plugins.push(new UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
      compress: {
        warnings: false
      }
    }
  }));
}

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

config.plugins.push(new ExtractTextPlugin({
  filename: '[name].css',
  disable: false, // always enabled for now
  allChunks: true
}));

module.exports = config;
```

_src/index.js_

```javascript
'use strict';

require('./index.global.scss');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
console.log('Hello JS!');
```

_src/index.legacy.css_

```css
@charset 'UTF-8';

/* this is pure CSS */

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

## PostCSS plugins

One does not simply... don't use PostCSS. [Use plugins!](https://cdn.meme.am/instances/500x/68322636.jpg)

#### Loader and plugins

Loader  
[postcss-loader](https://github.com/postcss/postcss-loader)  

Basic PostCSS plugins and their documentation  
[autoprefixer](https://github.com/postcss/autoprefixer)  
[node-css-mqpacker](https://github.com/hail2u/node-css-mqpacker)  
[cssnano](https://github.com/ben-eb/cssnano)

```sh
npm install postcss-loader --save-dev
npm install css-mqpacker --save-dev
npm install autoprefixer --save-dev
npm install cssnano --save-dev
```

#### Notes

It is [recommended](https://github.com/postcss/postcss-loader#plugins) to use seperate `postcssrc.js` file and it is way to go in v2. All possible filenames and formats (JSON, YAML, JS) are discussed [here](https://github.com/michael-ciniawsky/postcss-load-config)

We could use `cssnano` via [css-loader](https://github.com/webpack-contrib/css-loader#minification), but let us do separate pass for minification via PostCSS ecosystem.

#### PostCSS configuration file

Add new file at project root.

_.postcssrc.js_

```javascript
module.exports = (ctx) => ({
  plugins: [
    require('autoprefixer')({
      // browsers: [], // defined in .browserslistrc file!
      cascade: true,
      remove: true
    }),
    require('css-mqpacker')(),
    // we always minimise CSS, also on dev, as we have source maps, but this shows how we can make this env aware
    ctx.env === 'development'
    ? null
    : require('cssnano')({
      discardComments: {
        removeAll: true
      },
      autoprefixer: false,
      zindex: false,
      normalizeUrl: false
    })
  ].filter((e) => e !== null)
});
```

#### Autoprefixer

`autoprefixer` (browserslist) rules [should](https://github.com/postcss/autoprefixer#browsers) be put into either `package.json` or `browserslist` config file ([see docs](https://github.com/ai/browserslist#packagejson)). We are going to put them in `.browserslistrc`.

Target super old browsers to see the result

Add new file at project root.

_.browserlistrc_

```
[production]
last 2 versions
Explorer 10
iOS > 7

[development]
> 0.0001%

```

Then also add `postcss-loader` in the loaders pipe.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// MODULE RULES

config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
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
        ]
      })
    }
  ]
};

// ...
```

Run webpack and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Prefixes everywhere!

## normalize.css

Always use [Normalize.css](https://necolas.github.io/normalize.css/). Although our *cut the mustard* script does fallback page for anything below IE11 this fallback has to look O.K., so use Normalize.css that supports IE8+ (which is 7.x as of now.)

```sh
npm install normalize.css --save-dev
```

We add it as a module, so prefix it `~`. So now you know what `resolve: { modules: [] }` in webpack stands for. Search paths!

Add to _src/index.global.scss_ SCSS `@import '~normalize.css';`

Run webpack and inspect `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

## Webpack CSS source maps

As you can see we pass `sourceMap` option to our loaders (currently we do not have any loaders for JavaScript). But where are the source maps? Use webpack [devtool](https://webpack.js.org/configuration/devtool/).

First try

_webpack.front.config.js_

```javascript
// ...

// ----------------
// Source map conf
const sourceMapType = (development) ? 'inline-source-map' : false;

// ...

let config = {
  devtool: sourceMapType,
  // ...
};

// ...

if (production) {
  config.plugins.push(new UglifyJsPlugin({
    parallel: true,
    uglifyOptions: {
      compress: {
        warnings: false
      }
    },
    sourceMap: sourceMapType // evaluates to bool
  }));
}

// ...
```

Run webpack for development and production and inspect last lines of `public/assets/index.js` and `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Now try

```javascript
// ...
const sourceMapType = (!production) ? 'source-map' : false;
// ...
```

Run webpack and inspect `public/assets/` directory (look for `map` files). There are also other source map trypes available, read the docs.

Set it back to generate inline source maps for now. [Read about performance.](https://webpack.js.org/guides/build-performance/#devtool)

## Make SCSS build environment aware

Our SCSS should also know what environment it is built for.

_webpack.front.config.js_

```javascript
// ...
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
// ...
```

Usage example

_index.global.scss_

```scss
@charset 'UTF-8';
@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: magenta;
} @else {
  $paragarphColor: yellow;
}

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;

  p {
    color: $paragarphColor;
  }

}
```

Build for *development* and *production*, note the differences.

## Webpack file-loader & url-loader & resolve-url-loader

Now let us add some images to source. Make `my-small-image.jpg` below 20 KB [this is handy](http://lorempixel.com/200/200/) and `my-large-image.jpg` about 50 KB [this is handy](http://lorempixel.com/600/600/). Put them under `src/images` directory.

Loaders  
[file-loader](https://github.com/webpack-contrib/file-loader)  
[url-loader](https://github.com/webpack-contrib/url-loader)  
[resolve-url-loader](https://github.com/bholloway/resolve-url-loader)  

`url-loader` works like the file loader, but can return a *Data Url* if the file is smaller than a limit.  
`resolve-url-loader` is needed because we set file path in `url()` relative to the SCSS file we are working in, however webpack tries to resolve from entry point.

```sh
npm install file-loader --save-dev
npm install url-loader --save-dev
npm install resolve-url-loader --save-dev
```

Add image to our SCSS as well as pure CSS file

_src/index.global.scss_

```scss
@charset 'UTF-8';
@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: magenta;
} @else {
  $paragarphColor: yellow;
}

body {
  background-image: url('./images/my-large-image.jpg');
}

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;

  p {
    color: $paragarphColor;
  }

  background-image: url('./images/my-small-image.jpg');
}
```

Add loaders to module rules. Note that we resolve URLs in SCSS pipe as well we add loader for image files (don't be surprised about not including SVG, later on that).

_webpack.front.config.js_

```javascript
// ...

config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          }
        ]
      })
    },
    {
      test: /\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 3,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        }
      ]
    }
  ]
};

// ...
```

Run webpack and inspect `public/assets/` directory and `public/assets/index.css`

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

Notice how larger image is outputted as file while smaller image is inlined 

```css
.app {
  background-image: `url(data:image/jpeg;base64,...);
```

in CSS. Just as intended.

## Webpack image-webpack-loader

But we can do better. Let us minify the images.  
_Minify PNG, JP(E)G, GIF and SVG images with [imagemin](https://github.com/imagemin/imagemin)._

Loader  
[image-webpack-loader](https://github.com/tcoopman/image-webpack-loader)  

```sh
brew install automake libtool libpng
npm install image-webpack-loader --save-dev
```

See docs, we keep default minification opts here

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        {
          loader: 'image-webpack-loader',
          options: {}
        }
      ]
    }
// ...
```

Run webpack and inspect `public/assets/` directory, how outputted image size differs from source.

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

This process is expensive. In development we do not care about file size as we are either developing locally or in intranet, so set it to 

```javascript
// ...
    {
      test: /\.(png|jpe?g|gif)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        (production)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    }
// ...
```

## Fonts - webfont building

Convert TTF/OTF to all webwonts (WOFF, WOFF2, EOT, SVG) in building process.

All webfonts should end with `*-webfont.ext` in their filename.

Font squirrel online generator is good enough [Font Squirrel Generator](https://www.fontsquirrel.com/tools/webfont-generator), or use [fontplop](https://github.com/matthewgonzalez/fontplop)

## Fonts - webfont packing & loading

Choose font that has few styles (regular and bold + italic) for simplicity. [Space Mono](https://www.fontsquirrel.com/fonts/space-mono)  
Convert fonts and put them all under `src/fonts/spacemono/`.

We need also extra file `fonts/spacemono-definition.scss`.

Define font family. This example uses bulletproof syntax, but actually [you can retire it](https://www.zachleat.com/web/retire-bulletproof-syntax/).

_fonts/spacemono-definition.global.scss_

```scss
@charset 'UTF-8';

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-bold-webfont.eot');
  src:
    url('./spacemono/spacemono-bold-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-bold-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-bold-webfont.woff') format('woff'),
    url('./spacemono/spacemono-bold-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-bold-webfont.svg#space_monobold') format('svg');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-bolditalic-webfont.eot');
  src:
    url('./spacemono/spacemono-bolditalic-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-bolditalic-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-bolditalic-webfont.woff') format('woff'),
    url('./spacemono/spacemono-bolditalic-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-bolditalic-webfont.svg#space_monobold_italic') format('svg');
  font-weight: 700;
  font-style: italic;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-regular-webfont.eot');
  src:
    url('./spacemono/spacemono-regular-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-regular-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-regular-webfont.woff') format('woff'),
    url('./spacemono/spacemono-regular-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-regular-webfont.svg#space_monoregular') format('svg');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'spacemono-webpack';
  src: url('./spacemono/spacemono-italic-webfont.eot');
  src:
    url('./spacemono/spacemono-italic-webfont.eot?#iefix') format('embedded-opentype'),
    url('./spacemono/spacemono-italic-webfont.woff2') format('woff2'),
    url('./spacemono/spacemono-italic-webfont.woff') format('woff'),
    url('./spacemono/spacemono-italic-webfont.ttf') format('truetype'),
    url('./spacemono/spacemono-italic-webfont.svg#space_monoitalic') format('svg');
  font-weight: 400;
  font-style: italic;
}
```

Import definitions, set typography globals

_src/typography.global.scss_

```scss
@charset 'UTF-8';

@import 'fonts/spacemono-definition.global.scss';

body {
  font-family: 'spacemono-webpack', 'Comic Sans MS', monospace;
  font-weight: 400;
}

em,
i { font-style: italic; }

strong,
b {
  font-weight: 700;
}

strong em,
strong i,
b em,
b i,
em strong,
em b,
i strong,
i b {
  font-weight: 700;
  font-style: italic;
}
```

Import typography into index SCSS

_src/index.global.scss_

```scss
@charset 'UTF-8';
@import '~normalize.css';
@import 'index.legacy.css';
@import 'typography.global.scss';

// ...
```

Add loaders for font files in webpack config. We can simply use `file-loader` but as an example use `url-loder` here as a reminder that there might be those rare cases where base64 inlining in CSS might would make sense. Anyways, we set limit so low, that no fonts will be inlined into CSS.

_webpack.front.config.js_

```javascript
// ...
    {
      test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff2'
        }
      }]
    },
    {
      test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/font-woff'
        }
      }]
    },
    {
      test: /\.otf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-opentype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/x-font-truetype' // application/font-sfnt
        }
      }]
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'application/vnd.ms-fontobject'
        }
      }]
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      use: [{
        loader: 'url-loader',
        options: {
          limit: 10,
          mimetype: 'mimetype=image/svg+xml'
        }
      }]
    }
// ...
```

Run webpack and inspect `public/assets/` directory and `public/assets/index.css`.

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

## Webpack SVG images vs SVG fonts

Let us distinguish between webfonts and images. We do it by namig convention. To do so, all webfonts alaways have to be suffixed with `-webfont`. If the *bulletproof syntax* is dropped then this can be avoided.

_webpack.front.config.js_

```javascript
// ...

    // raster and vector images (we need to exclude possible svg webfont)
    {
      test: /\.(png|jpe?g|gif|svg)$/,
      exclude: /.-webfont\.svg$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 20000
          }
        },
        (production)
          ? {
            loader: 'image-webpack-loader',
            options: {}
          }
          : null
      ].filter((e) => e !== null)
    },

//...
```

## Webpack GLSL shader loader

We write our shaders in separate files and build them within app.

There are two loaders that we have used, both work.

[webpack-glsl-loader](https://github.com/grieve/webpack-glsl-loader)

```sh
npm install webpack-glsl-loader --save-dev
```

_webpack.front.config.js_

```javascript
// ...

    {
      test: /\.(glsl|frag|vert)$/,
      use: 'webpack-glsl-loader'
    }

// ...
```

_example.js_

```javascript
// ...
  uniformTex0 = THREE.ImageUtils.loadTexture('path/to/texture.jpg');
// ...
  shaderProg = new THREE.ShaderMaterial({
    // ...
    uniforms: {
      // ...
      inTex0: {type: 't', value: uniformTex0},
    },
    // ...
    vertexShader: require('path/to/shader.vert'),
    fragmentShader: require('path/to/shader.frag')
  });
// ...
```

[phaser-glsl-loader](https://github.com/the-simian/phaser-glsl-loader)

```sh
npm install phaser-glsl-loader --save-dev
```

_webpack.front.config.js_

```javascript
    {
      test: /\.(glsl|frag|vert)$/,
      use: 'phaser-glsl-loader'
    }
```

_example.js_

```javascript
// ...
  shaderProg = new THREE.ShaderMaterial({
    // ...
    vertexShader: require('path/to/shader.vert').join('\n'),
    fragmentShader: require('path/to/shader.frag').join('\n')
  });
// ...
```

## Requiring js 

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

require('./index.global.scss');
var helpers = require('./helpers/helpers.simple.js');

var div = document.querySelector('.app');
div.innerHTML = '<h1>Hello JS</h1><p>Lorem ipsum.</p>';
console.log('Hello JS!');
helpers.helperA();
```

## Other loaders

### Webpack expose loader

Just for reference

When wanting to put things in global namespace

[expose loader](https://github.com/webpack/expose-loader)  

### Webpack script loader

Just for reference

[script-loader](https://github.com/webpack/script-loader)  

### Webpack style-loader

Just for reference. We have already installed this.  
Adds CSS to the DOM by injecting a `<style>` tag. Use with webpack-dev-server.
[https://github.com/webpack/style-loader](https://github.com/webpack/style-loader)

### Webpack other built in plugins to use

#### Obligatory

* [webpack.optimize.ModuleConcatenationPlugin](https://webpack.js.org/plugins/module-concatenation-plugin/)  
Scope hoisting

* [webpack.DefinePlugin](https://webpack.js.org/plugins/define-plugin/)  
Define free variables. Useful for having development builds with debug logging or adding global constants. The values will be inlined into the code which allows a minification pass to remove the redundant conditional.

#### Obligatory later

* [webpack.optimize.CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/)  
Will be used in code splitting and duplication prevention (currently does not apply)

#### Optional

* [webpack.optimize.OccurrenceOrderPlugin](https://webpack.js.org/guides/migrating/#occurrenceorderplugin-is-now-on-by-default) (now enabled by default)
* [webpack.optimize.MinChunkSizePlugin](https://webpack.js.org/plugins/min-chunk-size-plugin/) (currently does not apply)
* [webpack.optimize.LimitChunkCountPlugin](https://webpack.js.org/plugins/limit-chunk-count-plugin/) (currently does not apply)

_webpack.front.config.js_

```javascript
// ...

// ----------------
// PLUGINS
config.plugins = [];

// ----------------
// WEBPACK DEFINE PLUGIN
// ALWAYS

config.plugins.push(new webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  __CLIENT__: true,
  __SERVER__: false,
  __DEVELOPMENT__: development,
  __TESTING__: testing,
  __STAGING__: staging,
  __PRODUCTION__: production,
  __DEVTOOLS__: development
}));

// ----------------
// WEBPACK BUILT IN OPTIMIZATION
// ALWAYS

// ModuleConcatenationPlugin
config.plugins.push(new webpack.optimize.ModuleConcatenationPlugin());

// ----------------
// WEBPACK BUILT IN OPTIMIZATION
// IN PRODUCTION

if (production) {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      sequences: true,
      dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false,
      warnings: false
    },
    mangle: false,
    beautify: false,
    output: {
      space_colon: false,
      comments: false
    },
    extractComments: false,
    sourceMap: sourceMapType
  }));
}

// ----------------
// CODE SPLITTING

// config.plugins.push(new webpack.optimize.LimitChunkCountPlugin({maxChunks: 15}));
// config.plugins.push(new webpack.optimize.MinChunkSizePlugin({minChunkSize: 10000}));

// ...
```

Build both for development and production

```sh
rm -rf $(pwd)/public/assets/** && NODE_ENV=development npx webpack --config=$(pwd)/webpack.front.config.js --progress
rm -rf $(pwd)/public/assets/** && NODE_ENV=production npx webpack --config=$(pwd)/webpack.front.config.js --progress
```

---
# Webpack dev server
---

Check next guide. Using webpack without it's devserver is dubious.