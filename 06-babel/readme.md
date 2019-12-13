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
Images and fonts have to be copied to `src/..` from `media/..`.

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

Creating a new file _.babelrc_ under master directory and filling it.

For clarity purposes [shorthand](https://babeljs.io/docs/en/plugins/#plugin-shorthand) will not be used, thus using `preset-*` and later `plugin-*` explicitly.

_.babelrc_

```json
{
  "presets": ["@babel/preset-env"]
}
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
      test: /\.js$/,
      exclude: [/node_modules/, /bower_components/, /preflight\.js$/],
      use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: false,
          babelrc: true
        }
      }
    },
    
// ...
```

## Build

Make changes in `index.js`. For test using some bits and pieces such as arrow function, `const`/`let`, template literals, stuff that is ES2015+. And switching everywhere to ES2015 module syntax.

_src/index.js_

```javascript
// index.js

/* global __DEVELOPMENT__ */

'use strict';

import 'index.global.scss';
import {helperA} from 'extras/helpers.simple.js';
import myImagePath from 'images/my-js-image.jpg';

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
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p><img src="${myImagePath}" alt="My Image">`;
  div.innerHTML += `<label for="textfield">Enter your text</label>`;
  div.innerHTML += `<input id="textfield" type="text" name="testtext" placeholder="Text Here">`;
  div.classList.add('some-class');
  console.log('Hello JS!');
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

Within `public/assets/index.<hash>.js` array function, `const` and template string got compiled to ES5 so that browsers can pick them up.

```javascript
var src_myArrowFunction = function myArrowFunction() {
  var div = document.querySelector('.app');
  var today = greetings.today;
  div.innerHTML = "<h1>".concat(today, "</h1><p>Lorem ipsum.</p><img src=\"").concat(my_js_image, "\" alt=\"My Image\">");
  div.innerHTML += "<label for=\"textfield\">Enter your text</label>";
  div.innerHTML += "<input id=\"textfield\" type=\"text\" name=\"testtext\" placeholder=\"Text Here\">";
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};
```

*Use next generation JavaScript, today.*

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


Build project for development tier.

```sh
npm run front:build:dev
```

`I am simple helper A` and `I am simple helper B` can be found in `public/assets/index.js`.

Build project for testing tier.

```sh
npm run front:build:test
```

`I am simple helper B` can't be found in `public/assets/index.<hash>.js`.

Observation is related to webpack [tree shaking](https://webpack.js.org/guides/tree-shaking/) being in effect.

To keep this behaviour *permanent* (or if observation for someone differs probably because of different Babel version), edit *.babelrc*.

_.babelrc_

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

[Documentation](https://babeljs.io/docs/en/next/babel-preset-env.html#modules).

By explicitly setting `{ "modules": false }` Babel is told not to compile ES2015 modules found in app source to to some other module type.  
Some time ago default value for `modules` was `commonjs` (and setting to *false* was mandatory), now it is `auto` (and setting to *false* gives safety).

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

Adding needed keys to *.babelrc*

_.babelrc_

```json
{
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
}
```

The key setting here is [useBuiltIns](https://babeljs.io/docs/en/next/babel-preset-env.html#usebuiltins).

There has been confusion regarding these settings and docs, see [issue created by author](https://github.com/babel/babel/issues/7254).

It can be assumed now that this statement holds true

> When "useBuiltIns": "usage" is set then then all polyfills are stripped and only ones found by union of feature usage within the JavaScript code and specified browserlist are left.

Setting *.browserslistrc* to hold support for IE10.

_.browserslistrc_

```
[production staging testing]
last 1 version
Explorer 10

[development]
last 1 version
Explorer 10
```

Adding something that needs polyfill on older browsers in *src/index.js*, such as `Array.prototype.find`

_src/index.js_

```javascript
// ...

const myArrowFunction = () => {
  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (el) {
    return el > 10;
  });
  console.log('Array.find found elements', found);
  
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
  "android": "78",
  "chrome": "78",
  "edge": "18",
  "firefox": "70",
  "ie": "10",
  "ios": "13.2",
  "opera": "64",
  "safari": "13",
  "samsung": "10.1"
}

Using modules transform: false

Using plugins:
  transform-template-literals { "android":"4.4.3", "ie":"10", "ios":"8" }
  // ... and many others
  
Using polyfills with `usage` option:
[..../webpacktest-06-babel/src/index.js] Added following core-js polyfills:
  es.array.concat { "android":"78", "ie":"10" }
  es.array.find { "android":"78", "ie":"10" }
  
[..../webpacktest-06-babel/src/helpers/helpers.simple.js] Based on your code and targets, core-js polyfills were not added.
```

Babel informs us about `es6.array.find` as expected - [comapt table](https://kangax.github.io/compat-table/es6/#test-Array.prototype_methods_Array.prototype.find_a_href=_https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find_title=_MDN_documentation_img_src=_../mdn.png_alt=_MDN_(Mozilla_Development_Network)_logo_width=_15_height=_13_/_/a_nbsp;) shows that *Array.prototype.find* is not present in IE10 and AN 4.4.3 (one has to check obsolete platforms).

The two polyfills can be found in *public/assets/index.js*


_public/assets/index.js_

```javascript
// ...

/*!*********************************************************!*\
  !*** ./node_modules/core-js/modules/es.array.concat.js ***!
  \*********************************************************/
  
// ...  

/*!*******************************************************!*\
  !*** ./node_modules/core-js/modules/es.array.find.js ***!
  \*******************************************************/

// ...
```

### Second


Setting *.browserslistrc* to hold support/target last Chrome version only. It is expected that nearly no plugins and no polyfills will be compiled within the product.

_.browserslistrc_

```
[production staging testing]
last 1 Chrome version

[development]
last 1 Chrome version
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

There are many plugins and *umbrella* presets such as [babel-preset-es2015](https://babeljs.io/docs/plugins/preset-es2015/) that automatically installs a collection of transform plugins can also be used.

For this tutorial only few will be explicitly installed an used (except for *Hello React*, where dependencies may come via preset).

At this point introducing one for a test - a stage 4 proposal for ECMAScript *Object Rest/Spread*. 
Others such as *Class properties transform*, *Function bind transform*, *Syntax Dynamic Import* will be used later.

[Object rest spread transform](https://babeljs.io/docs/en/babel-plugin-proposal-object-rest-spread) 


Install

```sh
npm install @babel/plugin-proposal-object-rest-spread --save-dev
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
}
```

env option documentation can be found [here](https://babeljs.io/docs/en/6.26.3/babelrc#env-option).

Testing the plugin by adding object spread into *src/index.js*.

_src/index.js_

```javascript
// ...

const myArrowFunction = () => {
  // Spread test
  const someObject = {x: 11, y: 12};
  const {x} = someObject;
  console.log('x value', x);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);
  
  //...
```

Building while having `last 1 Chrome version` in *.browserslistrc*

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

There are polyfills that are not within *core-js*. For example [window.fetch polyfill](https://github.com/github/fetch)).

*core-js* also does not care about DOM polyfills.  
As an example this tut will add one extra polyfill to deal with `classList` as it is not [fully implemented even in IE10/IE11](http://caniuse.com/#search=classList).  

Setting *.browserslistrc* to hold support for IE10.

_.browserslistrc_

```
[production staging testing]
last 1 version
Explorer 10

[development]
last 1 version
Explorer 10
```

Installing polyfill

```
npm install eligrey-classlist-js-polyfill --save-dev
```

Importing it within app entry point (alternative would be to import *eligrey-classlist-js-polyfill* within `src/index.js`).

_src/webpack.front.config.js_

```javascript
// ..

  entry: {
    index: [
      'eligrey-classlist-js-polyfill',
      path.join(__dirname, 'src/index.js')
    ]
  },

// ..
```

Building app for development tier

```sh
npm run front:build:dev
```

gives polyfill built into *public/assets/index.js*.

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
Images and fonts have to be copied to `src/..` from `media/..`.

---
# Next

Linting JavaScript and CSS/SCSS.


