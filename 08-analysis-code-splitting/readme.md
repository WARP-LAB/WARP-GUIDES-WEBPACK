# Analysis and Code Splitting

---
# In this section

* Analysing the built products
* The issue that code splitting solves
* Code splitting setup
* Different approaches - common, vendor a.o. chunks
* Chunk naming
* Runtime and Manifest
* Inlining Runtime
* Lazy loading

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-07-lint`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-08-analysis-code-splitting`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`.

```sh
cd webpacktest-08-analysis-code-splitting
npm install
```

---
# Analysing the built products

[Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

### Install

```sh
npm install webpack-bundle-analyzer --save-dev 
```

### Configure

_webpack.front.config.js_

```javascript
// ...

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line no-unused-vars

// ...

// ----------------
// BundleAnalyzerPlugin
if (testing) {
  config.plugins.push(new BundleAnalyzerPlugin({
    analyzerHost: '127.0.0.1',
    analyzerPort: 4001
  }));
}

// ...
```

### Run analysis

```sh
npm run front:build:test
```

Console will output

```
Webpack Bundle Analyzer is started at http://127.0.0.1:4001
Use Ctrl+C to close it
```

Opening [http://127.0.0.1:4001](http://127.0.0.1:4001) shows analysis. One should get familiar with using this tool, module searching in the built products.


---
# The Issue?

## Introducing 3rd party (vendor) code

loadash is a good choice.

**Example of correct way to use loadash, which will not be used!**

The correct way would be to use *loadash* version that is set up as ES modules, has *sideEffects* and thus can be *tree shaken* by webpack.

```sh
npm install lodash-es --save-dev
```

```javascript
import {join as _join} from 'lodash-es';
console.log(_join(['Lodash', 'says', 'hi!'], ' '));
```

**In real life one should not import *loadash* as it will be done further below!** This tutorial will import all *loadash* although only one function is used. Importing all *lodash* will help visualise code splitting as it will take up hundreds of KBs in webpack bundle(s).

Installing loadash version that is not tree shakeable.

```sh
npm install lodash --save-dev
```

Adding loadash to *src/helpers/helpers.simple.js*

_src/helpers/helpers.simple.js_

```javascript
// helpers.simple.js

import {join as _join} from 'lodash';

export function helperA () {
  console.log('I am simple helper A');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'A', '!'], ' '));
}

export function helperB () {
  console.log('I am simple helper B');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'B', '!'], ' '));
}

```

Adding loadash to *src/index.js*

_src/index.js_

```javascript
// ...

import {join as _join} from 'lodash';

// ...

const myArrowFunction = () => {
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));

  // ...
  
```


Building for testing and analysing.

```sh
npm run front:build:test
```

[http://127.0.0.1:4001](http://127.0.0.1:4001)

Everything, including all *lodash* is emitted in *index.chunkhash.js* as shown by *Webpack Bundle Analyzer*.

## Introducing new entry point

Adding new entry called *section* to our site

_webpack.front.config.js_

```javascript
// ...

  entry: {
    section: [
      'eligrey-classlist-js-polyfill',
      path.resolve(__dirname, 'src/section.js')
    ],
    index: [
      'eligrey-classlist-js-polyfill',
      path.resolve(__dirname, 'src/index.js')
    ]
  },

// ...
```

Filling in *src/section.js*.

_src/section.js_

```javascript
// section.js

import {join as _join} from 'lodash';
import {helperA} from './helpers/helpers.simple.js';
import 'section.global.scss';

// Vendor test
console.log(_join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));

// Module test
helperA();

// Test Array.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Array.find found elements', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);

```

_src/section.global.scss_

```scss
@charset 'UTF-8';

input {
  border: 2px solid red;
}
```

Building for testing and analysing.

```sh
npm run front:build:test
```

[http://127.0.0.1:4001](http://127.0.0.1:4001)


*lodash* is built in both *index.chunkhash.js* as well as *section.chunkhash.js* as shown by *Webpack Bundle Analyzer*. The issue!

---
# Code splitting

## Intro

[Code Splitting](https://webpack.js.org/guides/code-splitting/)

As of now both *index.chunkhash.js* and *section.chunkhash.js* includes app code as well as dependency *loadash* (which in this example is few hundreds KB).

Firstly. In real world app would be updated as time goes. Whenever app code is updated a new *index.chunkhash.js* and *section.chunkhash.js* will be built. After such app update user would have to download the new files (cache busting) which are few hundreds KB and includes app code and vendor code (*lodash*). But why make user redownload code part that hasn't changed across app versions?

Secondly. Why not separating vendor code in another *chunk* (physical file) that app code can consume? If the monolithic output was spilt into vendor (*loadash* in this case) code i.e.  *vendor.chunkhash.js* and app code into *index.chunkhash.js* and *section.chunkhash.js* then on new app version user would only have to download the new app part (assuming that vendor code has really stayed the same and does not need update).

Thirdly. Where does vendor code end and app code start? One can imagine that there are cases where *helperA* as used in this tutorial also can be assumed to be *unchanging reference code*. Some inhouse *helper libraries/functions* that practically do not change and are consumed by app code. *helperA* is potentially a *common dependency* as it is used by both entry points (*index* and *section*).

This applies also if there was only one entry point, even then one could split code into parts that does not change (or does rarely) and actual living app code.

This tutorial will use [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/) to extract common dependencies that are used by multiple entry points into separate output. [Related article](https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366).

## Approach 1. Shared code chunk

### Configuration

_webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {
  
  // ----------------
  // SplitChunksPlugin

  // -----
  // Approach 1
  namedChunks: true,
  splitChunks: {
    cacheGroups: {
      sharedcode: {
        name: 'sharedcode',
        chunks: 'initial',
        minChunks: 2
      }
    }
  },

// ...
```

### Building for testing and analysing

```sh
npm run front:build:test
```

[http://127.0.0.1:4001](http://127.0.0.1:4001)

### Observations

*Webpack Bundle Analyzer* reports that

* *sharedcode.chunkhash.js* includes *loadash*, *core-js/internals*, *eligrey-classlist-js-polyfill*, *helpers.simple.js* and *Array.find*
* *index.chunkhash.js* includes *core-js/modules (polyfills)* and app code
* *section.chunkhash.js* includes *core-js/modules (polyfills)* and app code

*sharedcode* holds everything that is found at least 2 times.  

* What if 2 of the entry points start using yet another polyfill?
* Does polyfill really needs to be in vendor or should it be consider to be app code, not separated?
* What if one of the entry points drops *helperA* and switched to *helperB*? 
* What if *helpers* changed? 
* In case where *helpers* consist of two functions it is not worth chunking them (overall size vs load time)?

And here comes that all theses settings *depend*.

## Approach 2. Vendors only chunk (`node_modules` regex)

### Configuration

_webpack.front.config.js_

```javascript
// ...
  
  // -----
  // Approach 2A
  namedChunks: true,
  splitChunks: {
    cacheGroups: {
      vendors: {
        name: 'vendors',
        test: /node_modules/,
        chunks: 'all'
      }
    }
  },

// ...
```

### Building for testing and analysing

*--//--*

### Observations

*Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash*, *core-js/internals*, *core-js/modules (polyfills)*, *eligrey-classlist-js-polyfill*
* *index.chunkhash.js* includes *helpers.simple.js* and app
* *section.chunkhash.js* includes *helpers.simple.js* and app code

*sharedcode* holds everything that is found in *node_modules*, meanwhile *entry points* are stripped from *vendor code*.

### Extra notes

This is *regex splitting*. It gives a quick way to add *helpers.simple.js* (or whatever) as *vendor*

_webpack.front.config.js_

```javascript
// ...

  // -----
  // Approach 2B
  namedChunks: true,
  splitChunks: {
    cacheGroups: {
      vendors: {
        name: 'vendors',
        test: (module, chunks) => {
          return (
            module.resource &&
            (
              module.resource.includes('node_modules/') ||
              module.resource.includes('src/helpers/')
            )
          );
        },
        chunks: 'all'
      }
    }
  },

// ...
```

*Webpack Bundle Analyzer* reports that *helpers.simple.js* is now in *vendors.chunkhash.js*, *index.chunkhash.js* and *section.chunkhash.js* includes app code.

A sidenote and reminder is that inhouse *helper function/libaries* can be made as modules that are added to the project via *dependencies*. There is no need to publish them to npm registry - option of *npm install* from git or local directory exists. [npm package can be lot of things](https://docs.npmjs.com/cli/install).

## Approach 3. Explicit vendors and shared chunks

### Configuration

_webpack.front.config.js_

```javascript
// ...

  // -----
  // Approach 3
  namedChunks: true,
  splitChunks: {
    cacheGroups: {
      sharedcode: {
        name: 'sharedcode',
        chunks: 'initial',
        minChunks: 2,
        maxInitialRequests: Infinity,
        minSize: 0
      },
      vendors: {
        name: 'vendors',
        test: /node_modules/,
        chunks: 'initial',
        priority: 10,
        enforce: true
      }
    }
  },

// ...
```

### Building for testing and analysing

*--//--*

### Observations

*Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash*, *core-js/internals*, *core-js/modules (polyfills)*, *eligrey-classlist-js-polyfill*
* *sharedcode.chunkhash.js* includes *helpers.simple.js*
* *index.chunkhash.js* includes app code
* *section.chunkhash.js* includes app code

Note that change in Babel usage in app code can cange the huge *vendors* bundle.

## Approach 4. Explicit vendors, Babel and shared chunks

### Configuration

_webpack.front.config.js_

```javascript
// ...

  // -----
  // Approach 4
  namedChunks: true,
  splitChunks: {
    cacheGroups: {
      sharedcode: {
        name: 'sharedcode',
        chunks: 'initial',
        minChunks: 2,
        maxInitialRequests: Infinity,
        minSize: 0
      },
      babel: {
        name: 'babel',
        test: (module) => {
          return (
            module.resource &&
            module.resource.includes('node_modules') &&
            module.resource.includes('core-js/modules')
          );
        },
        chunks: 'initial',
        priority: 10,
        enforce: true
      },
      vendors: {
        name: 'vendors',
        test: (module) => {
          return (
            module.resource &&
            module.resource.includes('node_modules') &&
            !module.resource.includes('core-js/modules')
          );
        },
        chunks: 'initial',
        priority: 10,
        enforce: true
      }
    }
  },

// ...
```

### Building for testing and analysing

*--//--*

### Observations


*Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash*, *core-js/internals* and *eligrey-classlist-js-polyfill*
* *babel.chunkhash.js* includes *core-js/modules (polyfills)*
* *sharedcode.chunkhash.js* includes *helpers.simple.js*
* *index.chunkhash.js* includes app code
* *section.chunkhash.js* includes app code

This splitting is probaby the most atomic one for the codebase used in this turorial.

## Approach 5. It depends.

Splitting has to be considered per app.  
And not every even needs code splitting.

---
# Chunk naming

Set [`namedChunks: true`](https://webpack.js.org/configuration/optimization/#optimizationnamedchunks) at least until webpack 5 comes out. It essentially replaces IDs in

_webpack.front.config.js_

```javascript
// ...

chunkFilename: (development) ? '[id].js' : '[id].[chunkhash].js'

// ...

chunkFilename: (development) ? '[id].css' : '[id].[chunkhash].css'

// ...
```

with names as specified in `splitChunks` objects.

A quote from Tobias Koppers himself from [here](https://medium.com/webpack/webpack-4-0-to-4-16-did-you-know-71e25a57fa6b)

> There are a bunch of weird options optimization.namedModules optimization.hashedModuleIds optimization.namedChunks and optimization.occurrenceOrder. Actually they all affect how module and chunk ids are assigned and can’t be used together correctly. We now merged all these options into optimization.moduleIds and optimization.chunkIds with enum values. The old options will be removed in the next major version. We plan to add another way to assign module/chunk ids for long term caching, but this is not ready to be told yet.

# Runtime and Manifest

Building the app using *Approach 4* gives a set of chunk names.

```
vendors.21859e435ccfcf320170.js (160.67 KB)
babel.77480ff73a17ea40a0c2.js (13.6 KB)
index.a21522544ad4fc1cbff2.js (5.25 KB)
section.7ee27e961b165410207d.js (3.73 KB)
sharedcode.e50ca1054983c7d9d1b9.js (466 B)
```

Making a change in *helpers.simple.js*

_helpers.simple.js_

```javascript
// helpers.simple.js

import {join as _join} from 'lodash';

export function helperA () {
  console.log('I am simple helper A');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'A', '!'], ' '));
  console.log(_join(['Lodash', 'says', 'hi', 'again', 'from', 'helpers.simple.js', 'A', '!'], ' '));
}

export function helperB () {
  console.log('I am simple helper B');
  // Vendor test
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'B', '!'], ' '));
}
```

Building the app again gives new a set of chunk names.

```
vendors.8da9e1f272271a19863f.js (160.67 KB)
babel.b3e6110a3ceadb8b734d.js (13.6 KB)
index.4a19db783d83b02038cc.js (5.25 KB)
section.98370bde559abc22e5f3.js (3.73 KB)
sharedcode.d85cca8c4194be6b7fd3.js (598 B)
```

Although only *helpers.simple.js* was changed all chunks have new names. This is an issue as it forces end user to redownload app code which actually has not changed! It can be solved by extracting [Runtime and Manifest](https://webpack.js.org/concepts/manifest/) along with using [namedModules](https://webpack.js.org/configuration/optimization/#optimizationnamedmodules). 

_webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {

  // ----------------
  // SplitChunksPlugin

  namedModules: true,
  runtimeChunk: {
    name: 'runtime'
  },

  // -----
  // Approach 4

  // ...
```

Now, after adding/deleting line in *helpers.simple.js*

```javascript
console.log(_join(['Lodash', 'says', 'hi', 'again', 'from', 'helpers.simple.js', 'A', '!'], ' '));
```

only *helpers.chunkhash.js* changes.


## Other approach examples

* [webpack examples](https://github.com/webpack/webpack/tree/master/examples)

---
# Inlining Runtime

Hot replacement of inlined scripts will only work if caching is switched off for `html-webpack-plugin`. However when `!development` caching can be kept on as well as inlining enabled.

Inline *runtime.chunkhash.js* which contents is few KB when gzipped. There are [multiple plugins for html-weback-plugin](https://github.com/jantimon/html-webpack-plugin#plugins) for doing so.


[html-webpack-scripts-plugin](https://github.com/hypotenuse/html-webpack-scripts-plugin)

```sh
npm install html-webpack-scripts-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...

const HtmlWebpackScriptsPlugin = require('html-webpack-scripts-plugin'); // eslint-disable-line no-unused-vars

// ...

// HtmlWebpackPlugin - HtmlWebpackScriptsPlugin
if (!development) {
  config.plugins.push(new HtmlWebpackScriptsPlugin({
    'inline': /^runtime.*.js$/, // inline runtime
    'defer': /^(?!runtime).*.js$/ // add defer attribute to everything else
  }));
}

// ...
```

---
# Lazy loading

It is out of scope for this tut to discuss benefits of lazy loading (in context of sataged loading, meaningful paints, on demand (user interaction) application feature loading). This example is to show how to set up basic Babel plugin for it to be possible.

[webpack documentation](https://webpack.js.org/guides/lazy-loading/).

### Configure Babel for dynamic-import support

[@babel/plugin-syntax-dynamic-import](https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import)

```sh
npm install @babel/plugin-syntax-dynamic-import --save-dev
```

_.babelrc_

```
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import"
  ],
```

### Configure helpers.lazy

_src/helpers/helpers.lazy.js_

```javascript
// helpers.lazy.js

import './helpers.lazy.scss';

export function helperLazyA () {
  console.log('I am helper lazy A!');
}

export function helperLazyB () {
  console.log('I am helper lazy B!');
}
```

_src/helpers/helpers.lazy.scss_

```scss
@charset 'UTF-8';

body {
  background-repeat: no-repeat !important;
  background-color: #0f0 !important;
}

```

Within *src/section.js* dynamically `import()`ing *src/helpers/helpers.lazy.scss*

_src/section.js_

```javascript
// ...

// Lazy load something
import(/* webpackChunkName: "helpers.lazy" */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
```


### Building for analysis

Building the project for testing tier

```sh
npm run front:build:test
```

*Webpack Bundle Analyzer* reports a new chunk

```
vendors.093e667898b7d5c01d32.js (169.82 KB)
babel.24e0077964b9789c386a.js (22.45 KB)
runtime.0783d75dbcb41bbf6a12.js (5.61 KB)
index.00d2cdc57ef689fb0ff7.js (2.46 KB)
section.1461acae0f4cb449a2ad.js (1.2 KB)
sharedcode.f531f119058c78027d42.js (595 B)
helpers.lazy.4c0657b53b51eed697ed.js (564 B)
```

### Building

Disable *BundleAnalyzerPlugin*

Building the project for testing tier

```sh
npm run front:build:test
```

`helpers.lazy.js` is loaded, outputs to browser console and CSS to body backround is applied.

---
# What about TTFMP and splitting / inlining?

At this point in webpack 4 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) already does lot of good things that were impossible using [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) in webpack 3.

Sroll down for [**The big plan**](https://medium.com/webpack/the-new-css-workflow-step-1-79583bd107d7).

---
# Result

See `webpacktest-08-analysis-code-splitting` directory.  
Images and fonts have to be copied to `src/..` from `media/..`.

---
# Next

We will look about some webpack plugins for getting started with PWA.
