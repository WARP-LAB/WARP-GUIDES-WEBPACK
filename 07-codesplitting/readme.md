# Code Splitting

---
# In this section
---

* Analysing the built product by webpack
* The issue that code splitting solves
* Code splitting setup
* Different approaches - common, vendor, runtime (manifest) chunks
* Keeping the chunkhashes under control for caching
* Lazy loading, naming lazy loaded chunks
* Inlining runtime (manifest)

---
# Preflight
---

Use existing `webpacktest-lint` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-codesplitting`. Make changes in `package.json` name field. Don't forget `npm install`.


---
# webpack documentation
---

[Code Splitting](https://webpack.js.org/guides/code-splitting/)

---
# Analysing the bundle
---


[Webpack Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer)

```sh
npm install webpack-bundle-analyzer --save-dev 
```

*webpack.front.config.js*

```javascript
// ...
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// ...

// ----------------
// BundleAnalyzerPlugin

if (production) {
  config.plugins.push(new BundleAnalyzerPlugin());
}

// ...
```

In reality you would probably attach this analysis to something like `testing`, but let us do `production` here.

Console will output

```
Webpack Bundle Analyzer is started at http://127.0.0.1:8888
Use Ctrl+C to close it
```

---
# The Issue
---

## Introducing 3rd party (vendor) code

loadash is a good choice.

```sh
npm install lodash --save-dev
```

Add some loadash to our *helpers/helpers.simple.js*

```javascript
import _ from 'lodash';

export function helperA () {
  console.log('I am simple helper A');
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'A', '!'], ' '));
}

export function helperB () {
  console.log('I am simple helper B');
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'helpers.simple.js', 'B', '!'], ' '));
}
```

as well as *index.js*

```javascript
// ...
import _ from 'lodash';
// ...
  // Vendor test
  console.log(_.join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));
// ...
```

**In reality we should not import *loadash* as shown above.** It will import everything, yes - even although we use only one function from *loadash*, we have tree shaking. The correct way would be explicitly import the function needed

```javascript
import join from 'lodash/join';
// ...
  console.log(join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));
// ...
```

and / or use [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash).

However importing all *lodash* will help us visualise code splitting.

Let us build it. Everything, including *lodash* is emitted in *index.chunkhash.js* as shown by *Webpack Bundle Analyzer*.

### The First Point

As of now *index.chunkhash.js* includes code we've written (app code) as well as dependency *loadash* (which in this example is few hundreds KB).

In real world we would be updating our app as time goes. Whenever app code is updated a new *index.chunkhash.js* will be built, even if we made as small change as changing `console.log('Hello JS!');` to `console.log('Hello ES2015!');` After such app update user would have to download the new *index.chunkhash.js* (cache busting) that is few hundreds KB and includes app code and *lodash*. But why make user redownload code part that hasn't changed across app versions?

If we split our monolithic output into vendor code say  *vendor.chunkhash.js* and kept our actual app code into *index.chunkhash.js* then on new app version user would only have to download the new app part (assuming that vendor code has really stayed the same).


# Introducing new entry

Let us add new entry to our site

*section.js*

```javascript
import _ from 'lodash';
import {helperA} from './helpers/helpers.simple.js';

console.log(_.join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));
helperA();
```

*webpack.front.config.js*

```javascript
// ...
  entry: {
    index: [
      'classlist-polyfill',
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      'classlist-polyfill',
      path.join(__dirname, 'src/section.js')
    ]
  },
// ...
```


Let us build it. *lodash* is emitted in **BOTH** *index.chunkhash.js* as well as *section.chunkhash.js* as shown by *Webpack Bundle Analyzer*.

### The Second Point

If both of our entries use the same *loadash vendor code* how about extracting it into *vendor.chunkhash.js* that can be used by all entries at once?

Not that *index.chunkhash.js* will emit its *vendor_for_index.chunkhash.js* and *section.chunkhash.js* will emit its *vendor_for_section.chunkhash.js*, but there will be one unified *vendor.chunkhash.js* for both.

---
# Code splitting
---

We are going to use [CommonsChunkPlugin](https://webpack.js.org/plugins/commons-chunk-plugin/) to extract common dependencies that are used by multiple entry points into separate output.  

This might include both 3rd pary vendor code as well as our own helpers.

## Approach 1. One separate output for all shared code

*webpack.front.config.js*

```javascript
// ...

  entry: {
    index: [
      'classlist-polyfill',
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      'classlist-polyfill',
      path.join(__dirname, 'src/section.js')
    ]
  },

// ...

// ----------------
// Code splitting

// CommonsChunkPlugin

// -----
// Approach 1. One seperate output for all shared code

// Shared block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'shared'
  ],
  minChunks: 2
}));

// ...
```

Build again. *Webpack Bundle Analyzer* reports that *shared.chunkhash.js*  includes *loadash*, but

* *index.chunkhash.js*
* *section.chunkhash.js*

is free of it. Good.

Observe that *shared.chunkhash.js* also includes `I am simple helper A`, thus also *helpers* code that is imported and used in `index` and `section` entries is built here.

First thing to consider is, to quote webpack docs - *This reduces overall size, but does have a negative effect on the initial load time.* In case where *helpers* consist of two functions it is not worth it (size looses to load time). If *helpers* consisted of hundreds of functions that would be imported in tens of entries - size might win over load time.

However what if those *helpers* changed? We return back to the issue, where user would have to download huge *shared.chunkhash.js* although only the smallest portion of it has changed (few *helpers* functions changed versus monolithic *lodash* that is unchanged).

## Approach 2. Explicit vendor chunk

*webpack.front.config.js*

```javascript
// ...

  entry: {
    vendor: [
      'classlist-polyfill',
      'lodash'
    ],
    index: [
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      path.join(__dirname, 'src/section.js')
    ]
  },
  
// ...

// -----
// Approach 2. Explicit vendor chunk

// Vendor block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'vendor'
  ],
  minChunks: Infinity
}));

// ...
```

Build again. *Webpack Bundle Analyzer* reports that *vendor.chunkhash.js*  includes *loadash*, but

* *index.chunkhash.js*
* *section.chunkhash.js*

is free of it. Good.

Note that *Infinity* gives us that the chunk only has what's inside vendor entry. If we omit that then in case of multiple entries common code (which is not vendor) might also be included in this chunk. Just as *Approach 1*.

Observe that *vendor.chunkhash.js* does not include `I am simple helper A`, it is present in *index.chunkhash.js* and *section.chunkhash.js*.

This case shows yet another possibility of managing *helpers*, namely make them to be *vendors* :) If some project needs a set of static functions, pack it as node module. There is no need to publish it to npm registry, just *npm install* it from git, or even local directory. As a reminder - [npm package can be lot of things](https://docs.npmjs.com/cli/install).


## Approach 3. Explicit vendor chunk and separate shared chunk

*webpack.front.config.js*

```javascript
// ...

  entry: {
    vendor: [
      'classlist-polyfill',
      'lodash'
    ],
    index: [
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      path.join(__dirname, 'src/section.js')
    ]
  },
  
// ...

// -----
// Approach 3. Explicit vendor chunk and separate shared chunk

// Shared block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'shared'
  ],
  minChunks: 2,
  chunks: [
    'index',
    'section'
  ]
}));

// Vendor block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'vendor'
  ],
  minChunks: Infinity
}));

// ...
```

Build again. *Webpack Bundle Analyzer* reports that *vendor.chunkhash.js*  includes *loadash*, but

* *index.chunkhash.js*
* *section.chunkhash.js*

is free of it. Good.

Observe that *shared.chunkhash.js* includes `I am simple helper A`, thus shared *helpers* code that is imported and used in `index` and `section` entries is built here (but not in *vendors*).

## Approach 4. Runtime.

Build again and note filenames for *vendor.chunkhash.js*,  *shared.chunkhash.js*, *index.chunkhash.js*, *section.chunkhash.js*.

Add something in *index.js*, say `console.log('EXTRA CONSOLE LOG');`

Build again. *index.chunkhash.js* has changed as expected. But so has *vendor.chunkhash.js*. Change to `console.log('EXTRA CONSOLE LOGZZ');`.. Every time something in *index.js* is changed outputted *vendor.chunkhash.js* also changes which is an issue.

This is an issue that can be solved by extracting *runtime*, or [*manifest*](https://webpack.js.org/concepts/manifest/).

*webpack.front.config.js*

```javascript
// ...

  entry: {
    vendor: [
      'classlist-polyfill',
      'lodash'
    ],
    index: [
      path.join(__dirname, 'src/index.js')
    ],
    section: [
      path.join(__dirname, 'src/section.js')
    ]
  },
  
// ...

// -----
// Approach 4. Runtime

// Shared block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'shared'
  ],
  minChunks: 2,
  chunks: [
    'index',
    'section'
  ]
}));

// Vendor block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'vendor'
  ],
  minChunks: Infinity
}));

// Runtime block
config.plugins.push(new webpack.optimize.CommonsChunkPlugin({
  name: [
    'runtime'
  ]
}));

// ...
```

Change `console.log('EXTRA CONSOLE LOGZZ');` within *index.js* multiple times and rebuild. Now the big *vendor.chunkhash.js* does not change its name any more, *index.chunkhash.js* and *runtime.chunkhash.js*.

One might argue what's the point, now we have one more source file and still two have changed. However, considering that *vendor* chunk in real application will be quite big and manifest is super small (it can be inlined) there are gains. And more entry points might follow, all using same vendor. Sure, for tiny applications we might not need neither code splitting nor manifest.

## Approach to take

Approach 4 with or without *Shared block*. Remember that once there is this idea that *Shared block* is needed, consider extracting those shared things into separate *npm package* and putting them inside *vendor*.


---
# Dynamic imports
---

First add Babel support

Install

```sh
npm install @babel/plugin-syntax-dynamic-import --save-dev
```

Add it to *.babelrc*

```
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import"
  ],
```

Add in *helpers/helpers.lazy.js*

```javascript
export function helperLazyA () {
  console.log('I am helper lazy A!');
}

export function helperLazyB () {
  console.log('I am helper lazy B!');
}
```

Within *section.js* dynamically `import()` it

```javascript
import(/* webpackChunkName: "helpers.lazy" */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
```

Build the project and note console log output. Now note the chunkhashes. What is this `0.chunkhash.js`? It is ID number that is assigned to our lazy imported chunk. The issue here is that as more lazy chunks are present in the code the more the possibility that IDs get shuffled. Name them!

*webpack.front.config.js*

```javascript
// ...

// ----------------
// Code splitting

// NamedChunksPlugin
config.plugins.push(new webpack.NamedChunksPlugin());

// ...
```

Rebuild. Now we get `helpers.lazy.chunkhash.js`. This also explains the *magic comment* `/* webpackChunkName: "helpers.lazy" */` within `import()`.


---
# Inlining chunked JS and CSS
---

Hot replacement of inlined scripts will only work if caching is switched off for `html-webpack-plugin`. However we can keep caching on and inline only when `!development`. In this example we will inline *runtime.chunkhash.js* which contents in our case is 1KB when gzipped. *StyleExtHtmlWebpackPlugin* shows how to inline CSS in HTML, however it is disabled in this example.

```sh
npm install script-ext-html-webpack-plugin --save-dev
npm install style-ext-html-webpack-plugin --save-dev
```

*webpack.front.config.js*

```javascript
// ...

const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin'); // eslint-disable-line no-unused-vars
const StyleExtHtmlWebpackPlugin = require('style-ext-html-webpack-plugin'); // eslint-disable-line no-unused-vars

// ...

// ----------------
// ScriptExtHtmlWebpackPlugin

config.plugins.push(new ScriptExtHtmlWebpackPlugin({
  inline: (development) ? [] : [
    /runtime.*.js$/
  ]
  // preload: /\.js$/,
  // defaultAttribute: 'async'
}));

// ----------------
// ScriptExtHtmlWebpackPlugin

config.plugins.push(new StyleExtHtmlWebpackPlugin({
  cssRegExp: /.css$/,
  position: 'plugin',
  minify: false,
  enabled: false // disable it or set !development
}));

// ...
```

---
# What about splitting CSS into multiple chunks / files?
---

Source: [https://medium.com/webpack/the-new-css-workflow-step-1-79583bd107d7](https://medium.com/webpack/the-new-css-workflow-step-1-79583bd107d7)

### *The big plan*  

*In the long term we want to make it possible to add first-class module support for CSS to webpack. This will work the following way:*

* *We add a new module type to webpack: Stylesheet (next to Javascript)
We adjust the Chunk Templates to write two files. One for the javascript and one of the stylesheets (in a .css file).*
* *We adjust the chunk loading logic to allow loading of stylesheets. We need to wait for CSS applied or at least loaded, before executing the JS.*
* *When we generate a chunk load we may load the js chunk and the stylesheet chunk in parallel (combined by Promise.all).*

*This has a few benefits:*

* *We can generate stylesheet files for on-demand-chunks (this was not possible with the extract-text-webpack-plugin)*
* *Using stylesheets is a lot easier compared to the extract-text-webpack-plugin*
* *Separate stylesheets will be the default workflow*
* *Stylesheets can be cached independent for javascript*
* *Stylesheet is only parsed once (by the css parser) compared to style-loader (by the js parser as string + the css parser)*

.. so yeah, hopefully in (near) future.

Till then there are

* strategies of getting first paint with separate CSS and DOM container that get removed when app loads
* multiple *ExtractTextPlugin* instances
* there is also [extract-css-chunks-webpack-plugin](https://github.com/faceyspacey/extract-css-chunks-webpack-plugin)

---
# Next
---

We will look at some basic *React* as well as *CSS modules* setup. However at this point - start coding!
