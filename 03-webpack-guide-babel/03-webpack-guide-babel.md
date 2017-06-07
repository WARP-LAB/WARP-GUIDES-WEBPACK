# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# Preflight
---

Use existing `webpacktest-devserver` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-babel`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-babel.dev`.

---
# Babel
---

Until now `site.js` contained old javascript (except for Common.js `require()` that got handled by webpack loader). You will have to write ES2015(ES6), ES2016, ES2017 code with probaly even some stage-x features.


## Babel core

[DOCS](https://babeljs.io/docs/setup/)

Install core

```sh
npm install babel-core --save-dev
```

## Babel env preset

Install presets [Docs](https://github.com/babel/babel-preset-env)

```sh
npm install babel-preset-env --save-dev
```

## Babel basic configuration

Crete new file _.babelrc_ under master directory and fill it

```json
{
  "presets": ["env"]
}
```

## Webpack Babel loader

This loader allows transpiling JavaScript files using Babel and webpack.  
[babel-loader](https://github.com/babel/babel-loader)

```sh
npm install babel-loader --save-dev
```

Now specify loader for JavaScript files. Exclude `node_modules` as they *should be* ES5 already. Exclude `src/preflight.js` as it by it's role in the webapp should never contain anything ES5+ (ES3 recommended) as of year 2017.

_webpack.front.config.js_

```javascript
    {
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      use: 'babel-loader'
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

Now change syntax in our `helpers.js` to ES2015 module `export` favour.

```javascript
export function helperA () {
  console.log('I am helper A');
}

export function helperB () {
  console.log('I am helper B');
}
```

Build it. Inspect how array function got compiled to old JavaScript, so that all decent browsers can use this.

```javascript
var myArrowFunction = function myArrowFunction() { /* ... */ }
```

## Tree shaking

Webpack 2 finaly has [tree shaking](https://webpack.js.org/guides/tree-shaking/).

Build project as is for production and look for `helperA` and `helperB` in compiled `assets/site.js`. Both are present.

Now edit _.babelrc_

```json
{
  "presets": [
    [
      "env", {
        "modules": false
      }
    ]
  ]
}
```

Build it again. Observe that `helperB` is not any more in the built product. Horray.

Essentially `"modules": false` ([see docs](https://github.com/babel/babel-preset-env#modules)) is disabling `babel-plugin-transform-es2015-modules-commonjs` which is included along with `babel-preset-env` and enabled by default. This plugin turns ES2015 modules into *CommonJS* modules which is issue as tree-shaking can be applied only on modules that have a static structure. Because of this webpack won’t be able to tree-shake unused code from the final bundle. Thus we need to disable it, Q.E.D.

## Babel polyfill

We need also polyfills. There are so many polyfills out there and methods to polyfill (user agent based), but let us use one supplied by Babel as it [works together](https://github.com/babel/babel-preset-env#usebuiltins) with `babel-preset-env`

[DOCS](https://babeljs.io/docs/usage/polyfill/)

```sh
npm install babel-polyfill --save-dev
```

Add `useBuiltIns` to _.babelrc_

```json
{
  "presets": [
    [
      "env", {
        "modules": false,
        "useBuiltIns": true,
        "debug": false
      }
    ]
  ]
}
```

## Other polyfills

The underlaying [core-js](https://github.com/zloirock/core-js) does not care about DOM polyfills. So as an example add one extra to deal with is `classList` as it is not [fully implemented in IE11](http://caniuse.com/#search=classList). There might be others!

```
npm install classlist-polyfill --save-dev
```

## Test polyfills

Import them to our JS app entry point.

_src/site.js_

```javascript
import 'babel-polyfill';
import 'classlist-polyfill';
import './site.global.scss';
import {helperA} from './helpers.js';

// ..
```

Build and inspect `public/site.js`. [Polyfills everywhere](https://cdn.meme.am/instances/500x/65651431.jpg).

## Shims

We do not deploy for old browsers. However we do nice fallbacks for clients. Not overdoing it with conditional IE style sheets, just basic stuff.  
Therefore some shims might be needed.

* lte IE 9
	* [foutbgone.js](https://github.com/renarsvilnis/fout-b-gone/)

* lte IE 8
	* [html5shiv.js](https://www.npmjs.com/package/html5shiv)
	* [html5shiv-printshiv.js](https://www.npmjs.com/package/html5shiv)
	* [respond.js](https://github.com/scottjehl/Respond)



## Babel configuration

Note `targets`. As of now it is still [PR](https://github.com/babel/babel-preset-env/pull/161) fror Babel to be able to read `browserslist` configs. When (if) this gets inplemented, we will be able to drop `targets` key here and both PostCSS as well as Babel can use shared config (via `package.json`/`browserslist`/`.browserslistrc`).  
Also keep eye on [UglifyJS compatability](https://github.com/babel/babel-preset-env#targetsuglify).

_.babelrc_

```json
{
  "presets": [
  	[
      "env",
    	{
        "targets": {
          "browsers": [
          	"> 1%",
          	"last 2 versions",
          	"Firefox ESR",
            "IE 11",
            "iOS > 7"
          ],
          "uglify": true
        },
        "useBuiltIns": true,
        "modules": false,
        "debug": false
      }
    ]
  ],
  "plugins": [
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

---
# Webpack polyfills and hoisting
---

At this point we should take a side step to reconfigure webpack entry.

Remove polyfill imports from `site.js` and add them to entry

```javascript
// ...

  entry: {
    site: [
      'babel-polyfill',
      'classlist-polyfill',
      path.join(__dirname, 'src/site.js')
    ],
    preflight: './src/preflight.js'
  },
  
// ...
```

This avoids some surprises down the road and is related to hoisting.


## Babel plugins

Some basic useful plugins, but this is per project setup.

```sh
npm install babel-plugin-transform-class-properties --save-dev
npm install babel-plugin-transform-function-bind --save-dev
npm install babel-plugin-transform-object-rest-spread --save-dev
```

_.babelrc_

```json
{
  "presets": [
    ...
  ],
  "plugins": [
    "transform-class-properties",
    "transform-function-bind",
    "transform-object-rest-spread"
  ],
  "env": {
    ...
  }
}

```