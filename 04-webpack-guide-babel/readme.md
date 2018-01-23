# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# Preflight
---

Use existing `webpacktest-htmlbuild` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-babel`.

Make changes in `package.json`.  
Make changes in `index.html` (`index-manual-approach.html`) to reflect host change to `webpacktest-babel.test` if you are not using HTML building as discussed in *htmlbuild* stage of this guide.

---
# Babel
---

Until now `site.js` contained old javascript (except for Common.js `require()` that got handled by webpack loader). You will have to write ES2015(ES6), ES2016, ES2017 code with probably even some stage-x features.


## Babel core

[DOCS](https://babeljs.io/docs/setup/)

Install core

Note, that currently Babel 7.x is alpha.

```sh
npm install @babel/core --save-dev
```

## Babel env preset

Install presets [Docs](https://github.com/babel/babel/tree/master/packages/babel-preset-env)

Note, that currently Babel 7.x is alpha.

```sh
npm install @babel/preset-env --save-dev
```

## Babel basic configuration

Crete new file _.babelrc_ under master directory and fill it

```json
{
  "presets": ["@babel/preset-env"]
}
```

## Webpack Babel loader

This loader allows transpiling JavaScript files using Babel and webpack.  
[babel-loader](https://github.com/babel/babel-loader)

Note, that currently Babel Loader 8.x is beta.

```sh
npm install babel-loader@8.0.0-beta.0 --save-dev
```

Now specify loader for JavaScript files. Exclude `node_modules` as they *should be* ES5 already. Exclude `src/preflight.js` as by it's role/definition it should never contain anything ES5+ (ES3 recommended) as of year 2017. Let us disable also cache which will help us observe behaviour down the line.

_webpack.front.config.js_

```javascript
    {
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      use: {
        loader: 'babel-loader',
        options: {
          babelrc: true,
          cacheDirectory: false
        }
      }
    },
```

## Webpack Babel test

Let us make changes in `site.js`. For test use arrow function that is ES6 feature as well as ES2015 module `import` syntax instead of `require()`. Instead of `import * as helpers from './helpers.js';` just import the needed helper.

_src/site.js_

```javascript
'use strict';

import './site.global.scss';
import {helperA} from './helpers.js';

if(__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

const greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS!'
};

const myArrowFunction = () => {
  const div = document.querySelector('.app');
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
```

Now change syntax in our `helpers.js` to ES2015(ES6) module `export` favour.

```javascript
export function helperA () {
  console.log('I am helper A');
}

export function helperB () {
  console.log('I am helper B');
}
```

Build it for production, for a moment disable `UglifyJsPlugin`. Inspect how array function got compiled to old JavaScript, so that all decent browsers can use this.

```javascript
var myArrowFunction = function myArrowFunction() { /* ... */ }
```

## Tree shaking

Webpack 2 finally has [tree shaking](https://webpack.js.org/guides/tree-shaking/).

Reenable `UglifyJsPlugin`. Build project as is for production and look for `I am helper A` and `I am helper B` in compiled `assets/site.js`. `I am helper B` is present although we never use it.

Now edit _.babelrc_

```json
{
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false
      }
    ]
  ]
}

```

Build it again. Observe that `I am helper B` is not any more in the built product. Horray.

Essentially `"modules": false` ([see docs](https://github.com/babel/babel-preset-env#modules)) is disabling `babel-plugin-transform-es2015-modules-commonjs` which is included along with `babel-preset-env` and enabled by default. This plugin turns ES2015 modules into *CommonJS* modules which is issue as tree-shaking can be applied only on modules that have a static structure. Because of this webpack won’t be able to tree-shake unused code from the final bundle. Thus we need to disable it, Q.E.D.

## Babel polyfill

We need also polyfills. There are so many polyfills out there and methods to polyfill (user agent based), but let us use one supplied by Babel as it [works together with `babel-preset-env`](https://github.com/babel/babel/tree/master/packages/babel-preset-env)

[DOCS](https://babeljs.io/docs/usage/polyfill/), however see my ranting why docs might be wrong [https://github.com/babel/babel/issues/7254](https://github.com/babel/babel/issues/7254)

Note, that currently Babel 7.x is alpha.

```sh
npm install @babel/polyfill --save-dev
```

Add needed keys to _.babelrc_

```json
{
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false,
        "useBuiltIns": "usage",
        "forceAllTransforms": false,
        "ignoreBrowserslistConfig": false,
        "debug": true
      }
    ]
  ]
}
```

Add something that needs polifill on older browsers in _site.js_, such as `Array.find`

```javascript
  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  let found = arr.find(function(element) {
    return element > 10;
  });
  console.log('Found elements', found);
```


## Test Babel polyfills


Build for production and inspect both building messages as well as `public/site.js`. [Polyfills everywhere](https://cdn.meme.am/instances/500x/65651431.jpg).

Note that babel informs us that

```
Added following polyfill:
  es6.array.find { "android":"4.4.3", "ie":"10" }
```

For for a moment change `.browserslistrc` production targets to `last 1 Chrome version`. Build again. Observe that babel does not need to include any polyfills (and outputted *site.js* bundle is smaller than when we were targeting older browsers in `.browserslistrc`).


## Other polyfills

The underlaying [core-js](https://github.com/zloirock/core-js) does not care about DOM polyfills. So as an example add one extra to deal with is `classList` as it is not [fully implemented in IE11](http://caniuse.com/#search=classList). There might be others!

```
npm install classlist-polyfill --save-dev
```

Import it to our app entry point, not in source.

_src/webpack.front.config.js_

```javascript
// ..

  entry: {
    site: [
      'classlist-polyfill',
      './src/site.js'
    ],
    preflight: './src/preflight.js'
  },

// ..
```

## Shims

We do not deploy for old browsers. However we do nice fallbacks for clients. Not overdoing it with conditional IE style sheets, just basic stuff.  
Therefore some shims might be needed.

* lte IE 9
	* [foutbgone.js](https://github.com/renarsvilnis/fout-b-gone/)

* lte IE 8
	* [html5shiv.js](https://www.npmjs.com/package/html5shiv)
	* [html5shiv-printshiv.js](https://www.npmjs.com/package/html5shiv)
	* [respond.js](https://github.com/scottjehl/Respond)



## Babel `forceAllTransforms` note

Note `forceAllTransforms` key in `.babelrc`.  
Previously it was `targets.uglify` key and had to be set to `true` to force everything to be changed to ES5. It was needed as in the build process we used UglifyJS that could take only ES5 code. Now the UglifyJS v3 that we use in building process (see 01 chapter of this tutorial, `uglifyjs-webpack-plugin`) is built on top in `uglify-es` (it is the stable outcome of "Harmony" branch which was transition for uglify to support ES6) and that can work with ES6 code.


## Babel plugins

Some basic useful plugins, but this is per project setup.

[Object rest spread transform](https://babeljs.io/docs/plugins/transform-object-rest-spread/)  
[Class properties transform](https://babeljs.io/docs/plugins/transform-class-properties/)  
[Function bind transform](https://babeljs.io/docs/plugins/transform-function-bind/)  

```sh
npm install babel-plugin-transform-class-properties --save-dev
npm install babel-plugin-transform-object-rest-spread --save-dev
npm install babel-plugin-transform-function-bind --save-dev
```

_.babelrc_

```json
{
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false,
        "useBuiltIns": "usage",
        "forceAllTransforms": false,
        "ignoreBrowserslistConfig": false,
        "debug": true
      }
    ]
  ],
  "plugins": [
    "transform-class-properties",
    "transform-function-bind",
    "transform-object-rest-spread"
  ],
  "env": {
    "development": {
    },
    "testing": {
    },
    "staging": {
    },
    "production": {
    }
  }
}

```

There are many pligins and we could also use *umbrella* presets such as [babel-preset-es2015](https://babeljs.io/docs/plugins/preset-es2015/) that automatically installs a collection of transform plugins, but for this tutorial we will use only few and explicitly will install them (except for Hello World React, where we will install deps via preset).
