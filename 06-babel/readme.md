# Babel

---
# In this section
---

* Short explanation what Babel does
* Installing Babel
* Module system and Tree Shaking
* Babel env preset and polyfills
* browserslist and Babel
* Other polyfills and shims
* Babel plugins

---
# Preflight
---

Use existing `webpacktest-htmlandcache` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-babel`. Make changes in `package.json` name field. Don't forget `npm install`.

---
# Babel
---

Until now `index.js` contained *old*, ECMAScript 3 compatible code.  
Exception was Node.js module system, `require` and `module.exports` (inspired by *Common.js* syntax) that got handled by webpack.  
You will have to write ES2015 (ES6) and newer code with probably even some [pre stage-3](https://github.com/tc39/proposals) features. In order for it to work in web browsers there is a need to compile it to ES5 code. [Babel](https://babeljs.io)!

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

Crete new file _.babelrc_ under master directory and fill it. We will not use [shorthand](https://babeljs.io/docs/plugins/#pluginpreset-shorthand) for clarity purposes, thus we will use `preset-*` and later `plugin-*` explicitly.

```json
{
  "presets": ["@babel/preset-env"]
}
```

## Webpack Babel loader

This loader allows transpiling JavaScript files using Babel and webpack.  
[babel-loader](https://github.com/babel/babel-loader)

Note, that currently Babel Loader for babel 7.x is also beta.

```sh
npm install "babel-loader@^8.0.0-beta" --save-dev
```

Now specify loader for JavaScript files within the *rules*. Exclude `node_modules` as they *should be* transpiled already. Exclude `src/preflight/preflight.js` as by it's role/definition it should never contain anything newer than ES3 (however building system will never pick it up anyways, as it is not *imported* in our entry or its children). Let us disable also cache which will help us observe behaviour down the line.

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

Let us make changes in `index.js`. For test use some bits and pieces such as arrow function, `const`/`let`, template literals, stuff that is ES2015+. And switch everywhere to ES2015 module syntax.

_src/index.js_

```javascript
/* global __DEVELOPMENT__ */
'use strict';

import './index.global.scss';
import {helperA} from './helpers/helpers.simple.js';

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
  div.innerHTML += `<label for="textfield">Enter your text</label>`;
  div.innerHTML += `<input id="textfield" type="text" name="testtext" placeholder="Text Here">`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
```

Change syntax in `helpers.simple.js` to ES2015 module `export` favour.

```javascript
export function helperA () {
  console.log('I am simple helper A');
}

export function helperB () {
  console.log('I am simple helper B');
}
```

For a moment you can disable `UglifyJsPlugin` by forcing `minimize: false` in `optimization` object. Build it for testing tier. 

```javascript
config.optimization = {
  minimize: false, 
  // ..
};
```

```sh
npm run build:front:test
``` 

Inspect how array function, `const` and template string got compiled to ES5 so that browsers can understand it.

```javascript
var myArrowFunction = function myArrowFunction() {
  var div = document.querySelector('.app');
  var today = greetings.today;
  div.innerHTML = "<h1>".concat(today, "</h1><p>Lorem ipsum.</p>");
  div.innerHTML += "<input type=\"text\" name=\"testtext\" placeholder=\"Text Here\">";
  div.classList.add('some-class');
  console.log('Hello JS!');
  (0, _helpersSimple.helperA)();
};
```

Just as Babel says - *Use next generation JavaScript, today.*

## Tree shaking

Reenable `UglifyJsPlugin`. Build project testing and look for `I am simple helper A` and `I am simple helper B` in compiled `assets/index.hash.js`.  

`helperB` is present although we explicitly imported and used only `helperA` in `index.js` (make sure that you have `drop_console: false` in `uglifyOptions`).

Webpack finally has [tree shaking](https://webpack.js.org/guides/tree-shaking/).

In order for Babel to support it edit _.babelrc_

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

By setting `{ "modules": false }` we tell Babel not to compile our ES2015 modules found in our code to Common.js modules (default value for `modules` is `commonjs`, see [docs](https://github.com/babel/babel/tree/master/packages/babel-preset-env#modules)). Webpack understands ES2015 modules syntax (static structure) which is what allows it to do tree shaking. And we need `UglifyJsPlugin` in the end to remove the dead code.

Build it again for testing. Observe that `helperB` is not to be found in the built product. Hooray!

## Babel polyfill

We need also polyfills. There are so many polyfills out there and methods to polyfill (user agent based), but let us use one supplied by Babel as it [works together with `@babel/preset-env` and browserslist](https://github.com/babel/babel/tree/master/packages/babel-preset-env#browserslist-support)

[DOCS](https://babeljs.io/docs/usage/polyfill/), however see my ranting as docs are wrong [https://github.com/babel/babel/issues/7254](https://github.com/babel/babel/issues/7254)

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

## Test Babel polyfills

Add something that needs polyfill on older browsers in _index.js_, such as `Array.prototype.find`

```javascript
  // Test Array.find polyfill
  const arr = [5, 12, 8, 130, 44];
  const found = arr.find(function (el) {
    return el > 10;
  });
  console.log('Found elements', found);
```

and let *.browserslistrc* hold support for IE10

```
[production staging testing]
last 2 versions
Explorer 10
iOS >= 7

[development]
last 2 versions
Explorer 10
iOS >= 7
```

Build for development and observe console

```
@babel/preset-env: `DEBUG` option

Using targets:
{
  "android": "4.4.3",
  "chrome": "65",
  "edge": "16",
  "firefox": "58",
  "ie": "10",
  "ios": "8",
  "safari": "11"
}

Using modules transform: false

Using plugins:
  transform-template-literals { "android":"4.4.3", "ie":"10", "ios":"8" }
  // ... and many others
  
Using polyfills with `usage` option:
[..../webpacktest-babel/src/index.js] Added following polyfill:
  es6.array.find { "android":"4.4.3", "ie":"10" }
  
[..../webpacktest-babel/src/helpers/helpers.simple.js] Based on your code and targets, none were added.
```

Note that babel informs us about `es6.array.find` as expected - [comapt table](https://kangax.github.io/compat-table/es6/#test-Array.prototype_methods_Array.prototype.find_a_href=_https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find_title=_MDN_documentation_img_src=_../mdn.png_alt=_MDN_(Mozilla_Development_Network)_logo_width=_15_height=_13_/_/a_nbsp;) shows that *Array.prototype.find* is not present in IE and AN 4.4.3 (you have to check obsolete platforms).

For for a moment change `.browserslistrc` nondevelopment tier targets to `last 1 Chrome version` and bserve the difference.

## Other polyfills

The underlaying [core-js](https://github.com/zloirock/core-js) does not care about DOM polyfills. So as an example add one extra to deal with is `classList` as it is not [fully implemented in IE11](http://caniuse.com/#search=classList). There are others down the line (say [whatwg-fetch](https://github.com/github/fetch))!

```
npm install classlist-polyfill --save-dev
```

Import it to our app entry point, not in source.

_src/webpack.front.config.js_

```javascript
// ..

  entry: {
    index: [
      'classlist-polyfill',
      path.join(__dirname, 'src/index.js')
    ]
  },

// ..
```

## Shims

We do not deploy for old browsers. However we do nice fallbacks for clients. Not overdoing it with conditional IE style sheets, just basic stuff.  

Some [shims](https://www.paulirish.com/2011/the-history-of-the-html5-shiv/) for reference.

* lte IE 8
	* [html5shiv.js](https://www.npmjs.com/package/html5shiv)
	* [html5shiv-printshiv.js](https://www.npmjs.com/package/html5shiv)
	* [respond.js](https://github.com/scottjehl/Respond)

* lte IE 9
	* [foutbgone.js](https://github.com/renarsvilnis/fout-b-gone/)


## Babel `forceAllTransforms` note

Note `forceAllTransforms` key in `.babelrc`.  
Previously it was `targets.uglify` key and had to be set to `true` to force everything to be changed to ES5. It was needed as in the build process we used UglifyJS that could take only ES5 code. Now the UglifyJS used in building process works with ES6 code (see 01 chapter of this tutorial, `uglifyjs-webpack-plugin`).

## Babel plugins

Beware that currently some of plugins are being moved to so called *mono repo*, thus correct install might be `npm install @babel/plugin-... --save-dev` instead of `npm install babel-plugin-... --save-dev`

There are many plugins and we could also use *umbrella* presets such as [babel-preset-es2015](https://babeljs.io/docs/plugins/preset-es2015/) that automatically installs a collection of transform plugins, but for this tutorial we will use only few and explicitly will install them (except for *Hello React*, where we will install deps via preset). Thus at this point introducing one:

[Object rest spread transform](https://github.com/babel/babel/tree/master/packages/babel-plugin-proposal-object-rest-spread) ([old docs](https://babeljs.io/docs/plugins/transform-object-rest-spread/))  

*Class properties transform*, *Function bind transform*, *Syntax Dynamic Import* will be used later.

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

Test it by adding object spread into _index.js_

```javascript
// ...

  // Spread test
  const someObject = {x: 11, y: 12};
  const {x} = someObject;
  console.log('x value', x);
  const objectCloneTestViaSpread = {...someObject};
  console.log('objectCloneTestViaSpread', objectCloneTestViaSpread);
  
//...
```

---
Next
---

Linting JavaScript and CSS/SCSS.


