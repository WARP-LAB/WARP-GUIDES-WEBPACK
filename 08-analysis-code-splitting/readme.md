# Analysis, Code Splitting and Webpack Runtime

---
# In this section

* Analysing the built products
* The issue that code splitting solves
* Code splitting setup
* Different approaches - common, vendor a.o. chunks
* Chunk naming
* Lazy loading
* Runtime (webpack Manifest)
* Inlining Runtime

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-07-lint`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-08-analysis-code-splitting`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

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
if (appProps.analyse && appProps.analyse.enable) {
  if (development) {
    console.log('\x1b[41m%s\x1b[0m', 'BundleAnalyzerPlugin should not be run when building for development / DevServer, aborting!');
    process.exit(1);
  }
  else {
    config.plugins.push(new BundleAnalyzerPlugin({
      analyzerHost: appProps.analyse.host,
      analyzerPort: appProps.analyse.port
    }));
  }
}

// ...
```

_properties.json_

```json
  "analyse": {
    "enable": true,
    "host": "127.0.0.1",
    "port": 4001
  },
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

*Webpack Bundle Analyzer* reports that all JavaScript code is built into *index.contenthash.js*.

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

Installing loadash version that is not *tree shakeable*.

```sh
npm install lodash --save-optional
```

Adding loadash to *src/helpers/helpers.simple.js*

_src/helpers/helpers.simple.js_

```javascript
// helpers.simple.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used

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

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used

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

Everything, including all *lodash* is emitted in *index.contenthash.js* as shown by *Webpack Bundle Analyzer*.

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
import {helperA} from 'extras/helpers.simple.js';
import 'section.scss';

// Vendor test
console.log(_join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));

// Module test
helperA();

// Test Array.prototype.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Array.prototype.find found elements in section', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);

```

_src/section.scss_

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

*lodash* is built in both *index.contenthash.js* as well as *section.contenthash.js* as shown by *Webpack Bundle Analyzer*. 

**That's an issue!**

---
# Code splitting

## Intro

[Code Splitting](https://webpack.js.org/guides/code-splitting/)

As of now both *index.contenthash.js* and *section.contenthash.js* includes app code as well as dependency *loadash* (which in this example is few hundreds of KBs to make the point more clearly).

Firstly. In real world app would be updated as time goes. Whenever app code is updated a new *index.contenthash.js* and *section.contenthash.js* will be built. After such app update (a small change in actual app code) user would have to download the new files (cache busting) which are few hundreds KB and includes app code and vendor code (*lodash*). But why make user redownload code part that hasn't changed across app versions (*lodash*)?

Secondly. Why not separating vendor code in another *chunk* (physical file) that all app entries can consume? If the monolithic output was spilt into vendor (*loadash* in this case) code i.e. *vendor.contenthash.js* and app code into *index.contenthash.js* and *section.contenthash.js* then on new app version user would only have to download the new app part (assuming that vendor code has really stayed the same and does not need update).

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

* *sharedcode.contenthash.js* includes *loadash*, *core-js (inc. polyfills that appear >=2 times)*, *eligrey-classlist-js-polyfill*, *helpers.simple.js*
* *index.contenthash.js* includes *core-js (inc. polyfills that appear <2 times)* and app code
* *section.contenthash.js* includes *core-js (inc. polyfills that appear <2 times)* and app code

* What if `src/index.js` also started using `String.prototype.endsWith` (`es.string.ends-with`)? What would happen to *sharedcode.contenthash.js*, *index.contenthash.js* and *section.contenthash.js* contents? 
* Does polyfill really needs to be in vendor or should it be consider to be app code, not separated? What if *section* was never *opened* by end user?
* What if one of the entry points drops *helperA* and switched to *helperB*? 
* What if *helpers* changed? 
* In case where *helpers* consist of two functions it is not worth chunking them (overall size vs load time)?

Simple summary - splitting strategy depends on project, per project.

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

* *vendors.contenthash.js* includes *loadash*, *core-js*, *eligrey-classlist-js-polyfill*
* *index.contenthash.js* includes *helpers.simple.js* and app
* *section.contenthash.js* includes *helpers.simple.js* and app code

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

*Webpack Bundle Analyzer* reports that *helpers.simple.js* is now in *vendors.contenthash.js*, *index.contenthash.js* and *section.contenthash.js* includes app code.

A sidenote and reminder is that inhouse *helper function/libaries* can be made as modules that are added to the project via *package dependencies*. There is no need to publish them to npm registry - option of *npm install* from git or local directory exists. [npm package can be lot of things](https://docs.npmjs.com/cli/install).

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

* *vendors.contenthash.js* includes *loadash*, *core-js*, *eligrey-classlist-js-polyfill*
* *sharedcode.contenthash.js* includes *helpers.simple.js*
* *index.contenthash.js* includes app code
* *section.contenthash.js* includes app code

Note that change in ES2015+ (thus Babel and thus core-js polyfill) usage in app code can cange the huge *vendors* bundle.

## Approach 4. Explicit vendors, core-js polyfill and shared chunks

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
      corepoly: {
        name: 'corepoly',
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

* *vendors.contenthash.js* includes *loadash*, *core-js (except polyfills)* and *eligrey-classlist-js-polyfill*
* *corepoly.contenthash.js* includes *core-js (polyfills)*
* *sharedcode.contenthash.js* includes *helpers.simple.js*
* *index.contenthash.js* includes app code
* *section.contenthash.js* includes app code

This splitting is probably the most atomic (and extreme) for the codebase used in this tutorial.

## Approach N. It depends.

Again, splitting has to be considered per app. And not every project needs it.

## Other approach examples

[webpack examples](https://github.com/webpack/webpack/tree/master/examples)

---
# Chunk naming

Set [`namedChunks: true`](https://webpack.js.org/configuration/optimization/#optimizationnamedchunks) at least until webpack 5 comes out. It essentially replaces IDs in

_webpack.front.config.js_

```javascript
// ...

chunkFilename: (development) ? '[id].js' : '[id].[contenthash].js'

// ...

chunkFilename: (development) ? '[id].css' : '[id].[contenthash].css'

// ...
```

with names as specified in `splitChunks` objects.

A quote from Tobias Koppers himself from [here](https://medium.com/webpack/webpack-4-0-to-4-16-did-you-know-71e25a57fa6b)

> There are a bunch of weird options optimization.namedModules optimization.hashedModuleIds optimization.namedChunks and optimization.occurrenceOrder. Actually they all affect how module and chunk ids are assigned and can’t be used together correctly. We now merged all these options into optimization.moduleIds and optimization.chunkIds with enum values. The old options will be removed in the next major version. We plan to add another way to assign module/chunk ids for long term caching, but this is not ready to be told yet.

---
# Lazy loading

It is out of scope for this tut to discuss benefits of lazy loading (in context of sataged loading, meaningful paints, on demand (user interaction) application feature loading). This tutorial application also does not have any user interaction, to make the point. This example is to show how to set up basic Babel plugin for it to be possible as well as if (how) it can affect output cachenames.

[webpack documentation on lazy loading](https://webpack.js.org/guides/lazy-loading/).

[magic comments for `<link rel=”prefetch/preload”>`](https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c).

### Configure Babel for dynamic-import support

[@babel/plugin-syntax-dynamic-import](https://babeljs.io/docs/en/babel-plugin-syntax-dynamic-import)

```sh
npm install @babel/plugin-syntax-dynamic-import --save-dev
```

_.babelrc.js_

```
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import"
  ],
```

### Configure helpers.lazy.one

_src/helpers/helpers.lazy.one.js_

```javascript
// helpers.lazy.one.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used
import './helpers.lazy.one.scss';

export function helperLazyOne () {
  console.log('I am helper lazy One!');
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.lazy.one.js', '!'], ' '));
  // console.log(_join(['Lazy', 'one', 'extra', '!'], ' '));
}

```

_src/helpers/helpers.lazy.one.scss_

```scss
@charset 'UTF-8';

body {
  background-repeat: no-repeat !important;
  background-color: #0f0 !important;
}

```

Within *src/index.js* dynamically `import()`ing *src/helpers/helpers.lazy.one.js*

_src/index.js_

```javascript
// ...

// Lazy load something
import(/* webpackChunkName: "helpers.lazy.one" */ 'extras/helpers.lazy.one.js').then((module) => {
  module.helperLazyOne();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyOne', error);
});

```

### Configure helpers.lazy.two

_src/helpers/helpers.lazy.two.js_

```javascript
// helpers.lazy.two.js

import {join as _join} from 'lodash'; // normally 'lodash-es' should be used
import './helpers.lazy.two.scss';

export function helperLazyTwo () {
  console.log('I am helper lazy Two!');
  console.log(_join(['Lodash', 'says', 'hi', 'from', 'helpers.lazy.two.js', '!'], ' '));
  // console.log(_join(['Lazy', 'two', 'extra', '!'], ' '));
}

```

_src/helpers/helpers.lazy.two.scss_

```scss
@charset 'UTF-8';

h1 {
  border: 2px dotted magenta;
}

```

Within *src/section.js* dynamically `import()`ing *src/helpers/helpers.lazy.two.js*

_src/section.js_

```javascript
// ...

// Lazy load something
import(/* webpackChunkName: "helpers.lazy.two" */ 'extras/helpers.lazy.two.js').then((module) => {
  module.helperLazyTwo();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyTwo', error);
});

```

### Building for analysis

```sh
npm run front:build:test
```

*Webpack Bundle Analyzer* reports following set of chunks (using *Approach 4*)

```
vendors.f75150c0ea744a30e3e2.js (169.82 KB)
corepoly.d74ebc616801f5f1a1b3.js (20.61 KB)
index.8a3652def41f7c6b899f.js (8.95 KB)
section.0044c32c88151568d454.js (6.79 KB)
helpers.lazy.one.2e4393c2d39807fcbbb6.js (615 B)
helpers.lazy.two.d3047cf2d3ced1a71891.js (615 B)
sharedcode.0ee865a086f35eee220c.js (466 B)
```

# Runtime (webpack Manifest)

Rebuilding (using *Approach 4*) without changing anything in app code keeps the hashes and thus chunk names *constant* as expected.

Making some changes in *lazy helpers*.

_src/helpers/helpers.lazy.one.js_

```javascript
// ...

  console.log(_join(['Lazy', 'one', 'extra', '!'], ' '));
  
// ...

```

_src/helpers/helpers.lazy.two.js_

```javascript
// ...

  console.log(_join(['Lazy', 'two', 'extra', '!'], ' '));
  
// ...

```

Building the app again gives new a set of chunk names.


```
vendors.f75150c0ea744a30e3e2.js (169.82 KB)
corepoly.d74ebc616801f5f1a1b3.js (20.61 KB)
index.ae0764b21480cb86f296.js (8.95 KB)
section.1374fc3f0f93f637b795.js (6.79 KB)
helpers.lazy.one.cc6cba39bae507869f7b.js (709 B)
helpers.lazy.two.52e78888b8af90c96381.js (709 B)
sharedcode.0ee865a086f35eee220c.js (466 B)
```

*index*, *section*, *helpers.lazy.one*, *helpers.lazy.two* all have changed hashes. Why are *index* and *section* changed, why make user redownload them if only the separate *lazy helpers* have changed?

It can be solved by extracting [Webpack Runtime](https://webpack.js.org/concepts/manifest/) in separate chunk. 

_webpack.front.config.js_

```javascript
// ...

// ----------------
// OPTIMISATION
config.optimization = {

  // ----------------
  // SplitChunksPlugin

  runtimeChunk: {
    name: 'runtime'
  },

  // -----
  // Approach 4

  // ...
```

Now, after toggling changes in both *lazy helpers* only

* *helpers.lazy.one.contenthash.js* changes 
* *helpers.lazy.two.contenthash.js* changes
* *runtime.contenthash.js* changes

In case of one lazy (and not only, that depends on `optimization.splitChunks` other options not discussed here) loaded chunk reasons to extract *runtime* may not be apparent, but if there are more, then it should be obvious, that there may be benefits.

---
# Inlining Runtime

Hot replacement of inlined scripts will only work if caching is switched off for `html-webpack-plugin`. However when `!development` caching can be kept on as well as inlining enabled.

Inline *runtime.contenthash.js* which contents is few KB when gzipped. There are [multiple plugins for html-weback-plugin](https://github.com/jantimon/html-webpack-plugin#plugins) for doing so.

[script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin) cannot be used due to [this issue](https://github.com/numical/script-ext-html-webpack-plugin/issues/29).

[html-webpack-scripts-plugin](https://github.com/hypotenuse/html-webpack-scripts-plugin) is one that can be used not only for `'inline': /^runtime.*.js$/` inlining, but also to set attributes.

[inline-chunk-manifest-html-webpack-plugin](https://github.com/jouni-kantola/inline-chunk-manifest-html-webpack-plugin)

[inline-manifest-webpack-plugin](https://github.com/szrenwei/inline-manifest-webpack-plugin)


```sh
npm install inline-manifest-webpack-plugin --save-dev
```

_webpack.front.config.js_

```javascript
// ...

const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin'); // eslint-disable-line no-unused-vars

// ...

// HtmlWebpackPlugin - InlineManifestWebpackPlugin
if (!development) {
  config.plugins.push(new InlineManifestWebpackPlugin('runtime'));
}

// ...
```

_src/html/index.template.ejs_

```ejs

  <% if (htmlWebpackPlugin.files.runtime) { %>
    <%= htmlWebpackPlugin.files.runtime %>
  <% } %>

```

---
# What about TTFMP and splitting / inlining?

At this point in webpack 4 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) already does lot of good things that were impossible using [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) in webpack 3.

Sroll down for [**The big plan**](https://medium.com/webpack/the-new-css-workflow-step-1-79583bd107d7).

---
# Result

See `webpacktest-08-analysis-code-splitting` directory.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

---
# Next

webpack plugins for getting started with PWA
