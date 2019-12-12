# SCSS, CSS, PostCSS settings

---
# In this section

* PostCSS
* Bootstrapping CSS with *normalize.css*
* CSS source maps
* Making SCSS tier aware

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-01-hello-world`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-02-css-and-postcss`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.

```sh
cd webpacktest-02-css-and-postcss
npm install
```

---
# PostCSS

Use [PostCSS](https://postcss.org).

## Loader and plugins

Loader  
[postcss-loader](https://github.com/postcss/postcss-loader)  

Basic PostCSS plugins and their documentation  
[autoprefixer](https://github.com/postcss/autoprefixer)  
[cssnano](https://github.com/cssnano/cssnano)  
[node-css-mqpacker](https://github.com/hail2u/node-css-mqpacker) (beware, it is [depreciated](https://github.com/hail2u/node-css-mqpacker/issues/72), but still useful)  

```sh
npm install postcss-loader --save-dev
npm install autoprefixer --save-dev
npm install cssnano --save-dev
```

## PostCSS configuration file

It is [recommended](https://github.com/postcss/postcss-loader#plugins) to use separate configuration file for PostCSS. All possible formats for configuration file are discussed [here](https://github.com/michael-ciniawsky/postcss-load-config).

Choosing JS file to set configuration as that enables some logic in the configuration file.

Adding new file at project root.

_.postcssrc.js_

```javascript
module.exports = (ctx) => ({
  plugins: [
    require('autoprefixer')({
      // browsers: [], // defined in .browserslistrc file!
      cascade: true,
      add: true,
      remove: false,
      supports: true,
      flexbox: true,
      grid: false
    }),
    // require('css-mqpacker')(), // depreciated
    ctx.env === 'development'
      ? null
      : require('cssnano')({
        // https://cssnano.co/guides/optimisations
        preset: ['default', {
          autoprefixer: false, // do not remove prefixes  
          discardComments: {
            removeAll: true,
          },
          normalizeUrl: false,
          normalizeWhitespace: true,
          zindex: false
        }]
      })
  ].filter((e) => e !== null)
});
```

## cssnano

CSS will be minified using a separate pass via PostCSS ecosystem (using `cssnano`. Of course [alternatives exist](https://goalsmashers.github.io/css-minification-benchmark/)).  

Keep CSS processing in as few places as possible. See also [webpack docs](https://webpack.js.org/plugins/mini-css-extract-plugin/#minimizing-for-production).

## Autoprefixer

`autoprefixer` (browserslist) rules [should](https://github.com/postcss/autoprefixer#browsers) be put into some [config file](https://github.com/browserslist/browserslist#config-file).  
This tut uses `.browserslistrc`.

Docs for autoprefixer rules set in _.postcssrc.js_ can be found [here](https://github.com/postcss/autoprefixer#options).

As an example unreasonably old browsers will be targeted for non-development to see the result. Add new file at project root.

_.browserslistrc_

```
[production staging testing]
> 0.0001%

[development]
last 1 version
```

Making use of [browserslist environments](https://github.com/browserslist/browserslist#configuring-for-different-environments).

## `postcss-loader`

Adding loader in the pipe.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.(css)$/,
      use: [
        development
        ? {
          loader: 'style-loader',
          options: {}
        }
        : {
          loader: MiniCssExtractPlugin.loader,
          options: {}
        },
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
      ],
    },
    {
      test: /\.(scss)$/,
      use: [
        development
        ? {
          loader: 'style-loader',
          options: {}
        }
        : {
          loader: MiniCssExtractPlugin.loader,
          options: {}
        },
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
      ],
    }
  ]
};

// ...
```

## Remove `optimize-css-assets-webpack-plugin`

`optimize-css-assets-webpack-plugin` is not needed any more, as CSS optimisation is done via PostCSS plugins. Remove it from _webpack.front.config.js_.

If one really wants to use `optimize-css-assets-webpack-plugin`, then nanocss options can be specified [as per docs](https://github.com/NMFR/optimize-css-assets-webpack-plugin#configuration) in _webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: !development, // can override
  minimizer: [
    // ...
    new OptimizeCSSAssetsPlugin({
      // HERE
    })
  ]
};

// ...
```

## Test PostCSS pipe

Run for development tier and inspect `.app` CSS in browser

```sh
npm run front:build:dev
```

Prefixes for `transform`.

Run for testing tier and inspect `.app` CSS in browser (or `public/assets/index.css`)

```sh
npm run front:build:test
```

Prefixes for `display: flex` and `transform` and CSS is minimised.

---
# normalize.css

Use [Normalize.css](https://necolas.github.io/normalize.css/). Although our usual *cut the mustard* at preflight enables fallback page for anything below IE11 *the fallback has to be readable*. There are alternatives such as [sanitize.css](https://github.com/csstools/sanitize.css) and [modern-normalize](https://github.com/sindresorhus/modern-normalize).

```sh
npm install normalize.css --save-dev
```

Importing in app source

_src/index.global.scss_

```scss
// ...
@import '~normalize.css';
// ...
```

Add it as a module, prefix it with `~`, webpack will resolve it. Read also sass-loader [docs on the topic](https://github.com/webpack-contrib/sass-loader#resolving-import-at-rules).

Running webpack

```sh
npm run front:build:test
```

Compiled CSS at `public/assets/index.css` should hold *normalize.css* code.

---
# Webpack CSS source maps

As one can see `sourceMap` option is passed to (S)CSS related loaders in *webpack.front.config.js*. But where are the source maps? No inline or map files are present, when inspecting `.app` class in browser's devtools - it references to compiled `index.css`, not `index.global.scss` which is the actual *source*.

Use webpack [devtool](https://webpack.js.org/configuration/devtool/) configuration.

webpack *mode* sets it to *eval* in *development mode*, otherwise to none OOB.

Add source map logic also to [TerserPlugin key](https://webpack.js.org/plugins/terser-webpack-plugin/#sourcemap) and [PostCSS pipe](https://github.com/postcss/postcss/blob/master/docs/source-maps.md#postcss-and-source-maps)

_webpack.front.config.js_

```javascript
// ...

// ----------------
// Source map type
const sourceMapType = 'inline-source-map';

// ...

// ----------------
// BASE CONFIG
let config = {
  // ...
  devtool: sourceMapType,
  // ...
};

// ...

    new TerserPlugin({
      // ...
      sourceMap: !!sourceMapType,
      // ...
    })
    
    // ...

// ...
```

While running webpack for testing and inspecting `.app` class in browser's inspector one can see the original definitions in `index.global.scss`.  
Inspect where console logs in JavaScript console are coming from.  
It all refers to original sources.  
Compiled files `index.js` and `index.css` at `public/assets/` hold inlined sourcemaps.

Now running webpack for testing with external map file

_webpack.front.config.js_

```javascript
const sourceMapType = 'source-map';
```

Result is seen in both browser inspector (CSS for `.app` and JavaScript console) as well as files in `public/assets/` directory.

Currently set configuration to have source map only when using development tier and have it inlined.

_webpack.front.config.js_

```javascript
const sourceMapType = (development) ? 'inline-source-map' : false;
```
Build both for development and any other tier, observe the difference

```sh
npm run front:build:dev
```

```sh
npm run front:build:test
```

Keep `inline-source-map` for now although it has slowest build & rebuild performance, read more on performance [here](https://webpack.js.org/configuration/devtool/).

webpack build performance [entry](https://webpack.js.org/guides/build-performance/#source-maps) about source maps simply states *Source maps are really expensive. Do you really need them?*. For his tutorial - yes, in order to show how.

---
# Make SCSS build environment aware

SCSS could also know what environment it is built for.

_webpack.front.config.js_

```javascript
// ...
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              prependData: `$env: ${tierName};`
            }
          }
// ...
```

Usage example

_index.global.scss_

```scss
@charset 'UTF-8';

// This is example of SCSS

@import '~normalize.css';
@import 'index.legacy.css';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: green;
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

Building for *development* and *testing* tiers yields different font colour for *Lorem ipsum* in rendered HTML as observed in browser.

---
# Result

See `webpacktest-02-css-and-postcss` directory.

---
# Next

Loading files (images, webfonts).
