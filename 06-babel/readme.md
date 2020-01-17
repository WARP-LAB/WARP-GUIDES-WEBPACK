# Babel

---
# In this section

* Short explanation what Babel does
* Installing Babel
* Core
* preset-env
* babelrc
* Babel loader
* Module system and Tree Shaking
* Babel polyfill and browserslist
* Babel plugins
* Other polyfills
* Shims

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-05-html-and-cache`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-06-babel`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

```sh
cd webpacktest-06-babel
npm install
```

---
# Babel

Until now `index.js` contained *old*, ES5 compatible code, except for `require` and `module.exports` (inspired by *Common.js* syntax) that got handled by webpack.    

One should write applications using modern JavaScript and it's features. Writing source in ES2015 (ES6) and newer code, sometimes maybe even using some [pre stage-3](https://tc39.es/process-document/) features.

In order for app to support web browsers and their versions that [do not have compatibility](https://kangax.github.io/compat-table/es6/) with JavaScript version ES2015 and newer a way to compile the source to ES5 output is needed.

[Babel](https://babeljs.io) does that.

## Babel core

[Documentation](https://babeljs.io/docs/setup/)

Install core

```sh
npm install @babel/core --save-dev
```

## Babel preset-env

[Documentation](https://babeljs.io/docs/en/next/babel-preset-env.html)

Install preset

```sh
npm install @babel/preset-env --save-dev
```

## Babel configuration file

Creating a new file _.babelrc.js_ under master directory and filling it.

For clarity purposes [shorthand](https://babeljs.io/docs/en/plugins/#plugin-shorthand) will not be used, thus using `preset-*` and later `plugin-*` explicitly.

_.babelrc.js_

```javascript
module.exports = {
  "presets": ["@babel/preset-env"]
};
```

## Babel loader

This loader allows transpiling JavaScript files using Babel and webpack.  

[babel-loader](https://github.com/babel/babel-loader)

```sh
npm install babel-loader --save-dev
```

Adding loader for JavaScript files within the *rules*.  
Excluding `node_modules` as they *should be* transpiled already.  
Just in case excluding `src/preflight/preflight.js` as by it's role/definition it should never contain anything newer than ES3 (however building system will never pick it up anyways, as it is not *imported* in the entry or its children).  
Currently disabling caching which will help to observe behaviour down the line.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      test: /\.(js|mjs|ts)x?$/,
      exclude: [/node_modules/, /bower_components/, /preflight\.js$/],
      use: [
        {
          loader: 'babel-loader',
          options: {
            cacheDirectory: false
          }
        }
      ]
    },
    
// ...
```

## Build

For test using some bits and pieces such as arrow function, `const`/`let`, template literals, stuff that is ES2015+. And switching everywhere to ES2015 module syntax.

_src/index.js_

```javascript
// index.js

/* global __DEVELOPMENT__ */

'use strict';

import {helperA} from 'extras/helpers.simple.js';
import 'index.global.scss';
import myImage from 'images/my-js-image.jpg';

if (__DEVELOPMENT__) {
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
  div.innerHTML += `<p><img src="${myImage}" alt="My Image"></p>`;
  div.innerHTML += '<p><label for="textfield">Enter your text</label></p>';
  div.innerHTML += '<p><input id="textfield" type="text" name="testtext" placeholder="Text Here"/></p>';
  div.classList.add('some-class');
  console.log('Hello new JS!');
  helperA();
};

myArrowFunction();

```

_helpers.simple.js_

```javascript
// helpers.simple.js

export function helperA () {
  console.log('I am simple helper A');
}

export function helperB () {
  console.log('I am simple helper B');
}

```

For a moment disabling minimising by forcing `minimize: false` in `optimization` object. 

_webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: false, // !development, // can override
  //...
  
```

Building for testing tier. 

```sh
npm run front:build:test
``` 

Within `public/assets/index.<contenthash>.js` array function, `const` and template string got compiled to ES5 so that browsers can pick them up.

```javascript
var greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS!'
};

var src_myArrowFunction = function myArrowFunction() {
  var div = document.querySelector('.app');
  var today = greetings.today;
  div.innerHTML = "<h1>".concat(today, "</h1><p>Lorem ipsum.</p>");
  div.innerHTML += "<p><img src=\"".concat(my_js_image, "\" alt=\"My Image\"></p>");
  div.innerHTML += '<p><label for="textfield">Enter your text</label></p>';
  div.innerHTML += '<p><input id="textfield" type="text" name="testtext" placeholder="Text Here"/></p>';
  div.classList.add('some-class');
  console.log('Hello new JS!');
  helperA();
};
```

*Use next generation JavaScript, today.*

Reenable optimisation.

---
# Module system and Tree Shaking

Reenable optimisation.

_webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {
  minimize: !development, // can override
  //...
  
```

Build project for development tier

```sh
npm run front:build:dev
```

`I am simple helper A` and `I am simple helper B` can be found in `public/assets/index.js`.

Build project for testing tier.

```sh
npm run front:build:test
```

`I am simple helper B` can't be found in `public/assets/index.<contenthash>.js`.

Observation is related to webpack [tree shaking](https://webpack.js.org/guides/tree-shaking/) being in effect.

To keep this behaviour *permanent* (or if observation for someone differs probably because of different Babel version), edit *.babelrc.js*.

_.babelrc.js_

```javascript
module.exports = {
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false
      }
    ]
  ]
};

```

[modules option documentation](https://babeljs.io/docs/en/next/babel-preset-env.html#modules).

By explicitly setting `{ "modules": false }` Babel is told not to compile ES2015 modules found in app source to to some other module type.  
Some time ago default value for `modules` was `commonjs` (and setting to *false* was mandatory), now it is `auto` (and setting to *false* gives confidence).

wbpack understands ES2015 modules syntax (static structure) which is what allows it to do tree shaking. And optimisation is needed in the end to remove the dead/unused code.

---
# Babel polyfill

There are multiple polyfills/methods to polyfill out there.

The one used before was [@babel/polyfill](https://babeljs.io/docs/usage/polyfill/) as it [works together with `@babel/preset-env` and browserslist](https://babeljs.io/docs/en/next/babel-preset-env.html#browserslist-integration). It is still supplied by Babel, however it is depreciated in favour of using it's dependencies directly.

> As of Babel 7.4.0, this package has been deprecated in favor of directly including core-js/stable (to polyfill ECMAScript features) and regenerator-runtime/runtime (needed to use transpiled generator functions):

*browserslist* is used in this tutorial since 2nd chapter.

## Install dependencies

```sh
npm install core-js --save-dev
npm install regenerator-runtime --save-dev
```

## Configure

Adding needed keys to *.babelrc.js*

_.babelrc.js_

```javascript
module.exports = {
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false,
        "useBuiltIns": "usage",
        "corejs": 3,
        "forceAllTransforms": false,
        "ignoreBrowserslistConfig": false,
        "debug": true
      }
    ]
  ]
};
```

The key setting here is [useBuiltIns](https://babeljs.io/docs/en/next/babel-preset-env.html#usebuiltins).

There has been confusion regarding these settings and docs, see [issue created by author](https://github.com/babel/babel/issues/7254).

It can be assumed now that this statement holds true

> When "useBuiltIns": "usage" is set then then only those polyfills are compiled into bundle that are demanded by specified browserlist, based on actual features that app JavaScript code uses.

Setting *.browserslistrc* to hold support for IE10.

_.browserslistrc_

```
# [production staging testing]
# > 0.0001%
#
# [development]
# last 1 version

[production staging testing]
last 1 chrome version
last 1 firefox version
Explorer 10

[development]
last 1 chrome version
last 1 firefox version
Explorer 10

```

Adding something that needs polyfill on older browsers (IE10) in *src/index.js*, such as `Array.prototype.find`

_src/index.js_

```javascript
// ...

const myArrowFunction = () => {
  // Test Array.prototype.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (el) {
    return el > 10;
  });
  console.log('Array.prototype.find found elements', found);
  
// ...
```

## Building

Building for development tier


```sh
npm run front:build:dev
```

## Observations

### First

While building terminal prints out *babel/preset-env* debug information (as `"debug": true` is set).

A shortened output stripping out nonsignificant parts.

```
@babel/preset-env: `DEBUG` option

Using targets:
{
  "chrome": "78",
  "firefox": "70",
  "ie": "10"
}

Using modules transform: false

Using plugins:
  transform-template-literals { "android":"4.4.3", "ie":"10", "ios":"8" }
  // ... and many others
  
Using polyfills with `usage` option:

[..../webpacktest-06-babel/src/index.js] Added following core-js polyfills:
	es.array.find { "ie":"10" }
  
[..../webpacktest-06-babel/src/helpers/helpers.simple.js] Based on your code and targets, core-js polyfills were not added.
```

Babel informs us about `es6.array.find` as expected - [comapt table](https://kangax.github.io/compat-table/es6/#test-Array.prototype_methods_Array.prototype.find_a_href=_https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find_title=_MDN_documentation_img_src=_../mdn.png_alt=_MDN_(Mozilla_Development_Network)_logo_width=_15_height=_13_/_/a_nbsp;) shows that *Array.prototype.find* is not present in IE10 (one has to check obsolete platforms).

The polyfill can be found in *public/assets/index.js*

_public/assets/index.js_

```javascript
// ...

/*!*******************************************************!*\
  !*** ./node_modules/core-js/modules/es.array.find.js ***!
  \*******************************************************/

// ...
```

### Second


Setting *.browserslistrc* to hold support/target last chrome version only. It is expected that nearly no plugins and no polyfills will be compiled within the product.

_.browserslistrc_

```
# [production staging testing]
# > 0.0001%
#
# [development]
# last 1 version

[production staging testing]
last 1 chrome version
# last 1 firefox version
# Explorer 10

[development]
last 1 chrome version
# last 1 firefox version
# Explorer 10
```

Rebuilding

```sh
npm run front:build:dev
```
 
Terminal debug information

```
babel/preset-env: `DEBUG` option

Using targets:
{
  "chrome": "78"
}

Using modules transform: false

Using plugins:
  syntax-async-generators { "chrome":"78" }
  syntax-object-rest-spread { "chrome":"78" }
  syntax-json-strings { "chrome":"78" }
  syntax-optional-catch-binding { "chrome":"78" }
  syntax-dynamic-import { "chrome":"78" }

Using polyfills with `usage` option:

[..../webpacktest-06-babel/src/index.js] Based on your code and targets, core-js polyfills were not added.

[..../webpacktest-06-babel/src/helpers/helpers.simple.js] Based on your code and targets, core-js polyfills were not added.
```

Result is as expected.

---
# Babel plugins

There are *umbrella* presets that automatically install a collection of plugins. Hor example historically a popular preset was [@babel/preset-es2015](https://github.com/babel/babel-archive/tree/master/packages/babel-preset-es2015).

For this tutorial only few plugins will be explicitly installed an used (except for *Hello React*, where dependencies may come via preset).

At this point introducing one for a test - a stage 4 proposal for ECMAScript [*Object Rest/Spread Properties for ECMAScript*](https://github.com/tc39/proposal-object-rest-spread).

Others such as *Class properties transform*, *Function bind transform*, *Syntax Dynamic Import* will be used later.

[@babel/plugin-proposal-object-rest-spread](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread) 

Install

```sh
npm install @babel/plugin-proposal-object-rest-spread --save-dev
```

_.babelrc.js_

```javascript
module.exports = {
  "presets": [
  	[
      "@babel/preset-env",
    	{
        "modules": false,
        "useBuiltIns": "usage",
        "corejs": 3,
        "forceAllTransforms": false,
        "ignoreBrowserslistConfig": false,
        "debug": true
      }
    ]
  ],
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread"
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
};

```

env option documentation can be found [here](https://babeljs.io/docs/en/6.26.3/babelrc#env-option).

Testing the plugin by adding object spread into *src/index.js*.

_src/index.js_

```javascript
// ...

const myArrowFunction = () => {
  // Rest/Spread test
  const someObject = {x: 11, y: 12};
  const {x, ...rest} = someObject;
  console.log('rest value', rest);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);
  
  //...
```

Building while still having `last 1 chrome version` only in *.browserslistrc*

```sh
npm run front:build:dev
```

gives terminal output

```
// ...

@babel/preset-env: `DEBUG` option

// ...

Using plugins:
  // ...
  syntax-object-rest-spread { "chrome":"78" }
  // ...

```

---
# Other polyfills

There are polyfills that are not within *core-js*. For example [window.fetch (whatwg-fetch) polyfill](https://github.com/github/fetch)).

*core-js* also does not care about DOM polyfills.  
As an example this tut will add one extra polyfill to deal with `classList` as it is not [fully implemented even in IE10/IE11](http://caniuse.com/#search=classList).  

Installing polyfill

```
npm install eligrey-classlist-js-polyfill --save-dev
```

Importing it within app entry point (alternative would be to import *eligrey-classlist-js-polyfill* within `src/index.js`).

_webpack.front.config.js_

```javascript
// ..

  entry: {
    index: [
      'eligrey-classlist-js-polyfill',
      path.resolve(__dirname, 'src/index.js')
    ]
  },

// ..
```

Building app for development tier

```sh
npm run front:build:dev
```

gives polyfill built into *public/assets/index.js*.

Such manual polifill addition has to be coder managed, as it does not uses feature detection, browserlistrc.

Setting *.browserslistrc* back to hold support for IE10.

_.browserslistrc_

```
# [production staging testing]
# > 0.0001%
#
# [development]
# last 1 version

[production staging testing]
last 1 chrome version
last 1 firefox version
Explorer 10

[development]
last 1 chrome version
last 1 firefox version
Explorer 10
```

---
# Shims

Deploying for browsers that may need shims is a rarity. However good looking fallbacks that ask user to update the browser in order to consume webapp may be a nice touch. Some resources w/o evaluation.

* lte IE 8
	* [html5shiv.js](https://www.npmjs.com/package/html5shiv)
	* [html5shiv-printshiv.js](https://www.npmjs.com/package/html5shiv)
	* [respond.js](https://github.com/scottjehl/Respond)

* lte IE 9
	* [foutbgone.js](https://github.com/renarsvilnis/fout-b-gone/)

---
# Result

See `webpacktest-06-babel` directory.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

---
# Next

Linting JavaScript and CSS/SCSS.


