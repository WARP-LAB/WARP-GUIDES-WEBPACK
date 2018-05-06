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


CommonsChunkPlugin has been depreciated, thus  
[SplitChunksPlugin docs](https://webpack.js.org/plugins/split-chunks-plugin/) and [discussion](https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366)

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
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // eslint-disable-line no-unused-vars

// ...

// ----------------
// BundleAnalyzerPlugin
if (!development) {
  config.plugins.push(new BundleAnalyzerPlugin());
}

// ...
```

In reality you would probably attach this analysis to something like `testing`, but let us do `!development` here.

```sh
npm run build:front:prod
```

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

**In reality we should not import *loadash* as shown above.** It will import everything, yes - even although we use only one function from *loadash* and we have tree shaking. The correct way would be explicitly import the function needed

```javascript
import join from 'lodash/join';
// ...
  console.log(join(['Lodash', 'says', 'hi', 'from', 'index.js!'], ' '));
// ...
```

or use [babel-plugin-lodash](https://github.com/lodash/babel-plugin-lodash).

However importing all *lodash* will help us visualise code splitting.

Let us build it. Everything, including *lodash* is emitted in *index.chunkhash.js* as shown by *Webpack Bundle Analyzer*.

## Introducing new entry point

Let us add new entry to our site

*section.js*

```javascript
import _ from 'lodash';
import {helperA} from './helpers/helpers.simple.js';

console.log(_.join(['Lodash', 'says', 'hi', 'from', 'section.js!'], ' '));
helperA();

// Test Array.prototype.find polyfill
const arr = [666, 11];
const found = arr.find(function (el) {
  return el > 10;
});
console.log('Found elements', found);

// Test String.prototype.endsWith polyfill
const question = 'Can you dig it?';
console.log(`Can you dig ${question.endsWith('it?')}`);
```

*webpack.front.config.js*

```javascript
// ...
  entry: {
    section: [
      'classlist-polyfill',
      path.join(__dirname, 'src/section.js')
    ],
    index: [
      'classlist-polyfill',
      path.join(__dirname, 'src/index.js')
    ]
  },
// ...
```

Let us build it. *lodash* is emitted in **BOTH** *index.chunkhash.js* as well as *section.chunkhash.js* as shown by *Webpack Bundle Analyzer*.

---
# Code splitting
---

## Intro

As of now both *index.chunkhash.js* and *section.chunkhash.js* includes code we've written (app code) as well as dependency *loadash* (which in this example is few hundreds KB).

In real world we would be updating our app as time goes. Whenever app code is updated a new *index.chunkhash.js* and *section.chunkhash.js* will be built, even if we made as small change as changing `console.log('Hello 1!');` to `console.log('Hello 2!');` After such app update user would have to download the new files (cache busting) that is few hundreds KB and includes app code and *lodash*. But why make user redownload code part that hasn't changed across app versions?

If we split our monolithic output into vendor code say  *vendor.chunkhash.js* and kept our actual app code into *index.chunkhash.js* and *section.chunkhash.js* then on new app version user would only have to download the new app part (assuming that vendor code has really stayed the same).

Note thet this applies also if we had only one entry point, even then we should split code into stuff that does not change or does so rarely and our actual ever updated app code.


We are going to use [SplitChunksPlugin](https://webpack.js.org/plugins/split-chunks-plugin/) to extract common dependencies that are used by multiple entry points into separate output.  

This might include both 3rd pary vendor code as well as our own helpers.

## Approach 1. Shared code chunk

*webpack.front.config.js*

```javascript
// ...

config.optimization = {
  // ..
  
  // -----
  // Approach 1
  splitChunks: {
    cacheGroups: {
      sharedcode: {
        name: 'sharedcode',
        chunks: 'initial',
        minChunks: 2
      }
    }
  }
  
};

// ...
```

Build again. *Webpack Bundle Analyzer* reports that

* *sharedcode.chunkhash.js* includes *loadash*, *classlist-polyfill*, *helperA* and *Array.find*
* *index.chunkhash.js* includes app code
* *section.chunkhash.js* includes *String.endsWith* and app code

As expected - *sharedcode* holds everyting that is found at least 2 times.  

* What if 2 of the entry points start using yet another polyfill?
* Does polyfill really needs to be in vendor or should we consider that to be app code, not separated?
* What if one of the entry points drops *helperA* and switched to *helperB*? 
* What if *helpers* changed? 
* In case where *helpers* consist of two functions it is not worth chunking them (overall size vs load time)?

And here comes that all theses settings *depend*. IMHO the result is not quite usable (maybe only if code is never to be changed).

## Approach 2. Vendors only chunk

*webpack.front.config.js*

```javascript
// ...

config.optimization = {
  // ..
  
  // -----
  // Approach 2
  splitChunks: {
    cacheGroups: {
      vendors: {
        name: 'vendors',
        test: /node_modules/,
        chunks: 'all'
      }
    }
  }
  
};

// ...
```

Build again. *Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash*, *classlist-polyfill*, *core-js* and *Array.find*
* *index.chunkhash.js* includes *helperA* and app
* *section.chunkhash.js* includes *helperA*, *String.endsWith* and app code

As expected - *sharedcode* holds everyting that is found in *node_modules* and nothing more.

Offtopic: you can make *helpers* to be *vendors*. If some project needs a set of static functions, pack it as node module. There is no need to publish it to npm registry, just *npm install* it from git, or even local directory. As a reminder - [npm package can be lot of things](https://docs.npmjs.com/cli/install).

## Approach 3. Explicit vendors and shared chunks

*webpack.front.config.js*

```javascript
// ...

config.optimization = {
  // ..
  
  // -----
  // Approach 3
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
  }
  
};

// ...
```

Build again. *Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash*, *classlist-polyfill*, *core-js*, *Array.find* and *String.endsWith*
* *sharedcode.chunkhash.js* includes *helperA*
* *index.chunkhash.js* includes app code
* *section.chunkhash.js* includes app code

Change in Babel usage in app code can mess up the huge *vendors* bundle.

## Approach 4. Explicit vendors, babel and shared chunks

*webpack.front.config.js*

```javascript
// ...

config.optimization = {
  // ..
  
  // -----
  // Approach 4
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
  }
};

// ...
```

Build again. *Webpack Bundle Analyzer* reports that

* *vendors.chunkhash.js* includes *loadash* and *classlist-polyfill*
* *babel.chunkhash.js* includes *core-js*, *Array.find* and *String.endsWith*
* *sharedcode.chunkhash.js* includes *helperA*
* *index.chunkhash.js* includes app code
* *section.chunkhash.js* includes app code


## Approach 5. Runtime.

Depending on approach taken when one changes someting in app code, ie., *index.js* it may undesirably affect other chunk hashes. This is an issue that can be solved by extracting *runtime*, or webpack sometimes calls it [*manifest*](https://webpack.js.org/concepts/manifest/) which is a bit confusing.

*webpack.front.config.js*

```javascript
// ...

config.optimization = {
  // ..
  
  runtimeChunk: {
    name: 'runner'
  },
  
  // ..  
};

// ...
```

One might argue what's the point, now we have one more source file. However, considering that chunks in real application will be quite big and manifest is super small (it can be inlined) there are gains. And more entry points might follow. Sure, for tiny applications we might not need neither code splitting nor manifest.

## Other approach examples

<https://github.com/webpack/webpack/tree/master/examples>  
<https://gist.github.com/sokra/1522d586b8e5c0f5072d7565c2bee693>  
<https://gist.github.com/gricard/e8057f7de1029f9036a990af95c62ba8>  


---
# Chunk naming
---

Either use this 

*webpack.front.config.js*

```javascript
config.optimization = {
  // ..
  runtimeChunk: {
    name: 'runner'
  },
  // ..  
};
// ...
// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  chunkFilename: (development) ? '[name].css' : '[name].[chunkhash].css'
}));
```

or

*webpack.front.config.js*

```javascript
config.optimization = {
  // ..
  runtimeChunk: {
    name: 'runner'
  },
  namedChunks: true, // overrides chunkFilename setting
  // ..  
};
// ...
// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  chunkFilename: (development) ? '[id].css' : '[id].[chunkhash].css' // namedChunks sets [id] to be [name] anyways
}));

```

It is unadvisable to use IDs for CSS file chunk names as ID changes altghough the code for specific chunk has not changed (you can try it by lazy loading stuff at different places within the app for N times or adding new webpack entries).

---
# Dynamic lazy imports
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
import './helpers.lazy.scss';

export function helperLazyA () {
  console.log('I am helper lazy A!');
}

export function helperLazyB () {
  console.log('I am helper lazy B!');
}
```

Add in *helpers/helpers.lazy.scss*

```scss
body {
  background-repeat: no-repeat !important;
  background-color: #0f0 !important;
}
```

Within *section.js* dynamically `import()` it

```javascript
// Lazy load something
import(/* webpackChunkName: "helpers.lazy" */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});
```

Build the project and note console log output. As of webpack 4 lazy imported chunk names are fixed and no need to expicitly push `webpack.NamedChunksPlugin()`.

---
# Inlining chunked JS and CSS
---

Hot replacement of inlined scripts will only work if caching is switched off for `html-webpack-plugin`. However we can keep caching on and inline only when `!development`. In this example we will inline *runner.chunkhash.js* which contents in our case is 1KB when gzipped.

* For JavaScript [html-webpack-scripts-plugin](https://github.com/hypotenuse/html-webpack-scripts-plugin) has to be used as it can work with both `inject: (true|false)`, [script-ext-html-webpack-plugin](https://github.com/numical/script-ext-html-webpack-plugin) cannot work with custom templates
* For CSS currently template logic has to be used, see [my comment](https://github.com/numical/style-ext-html-webpack-plugin/pull/40#issuecomment-386904837)

```sh
npm install html-webpack-scripts-plugin --save-dev
```

*webpack.front.config.js*

```javascript
// ...

const HtmlWebpackScriptsPlugin = require('html-webpack-scripts-plugin'); // eslint-disable-line no-unused-vars

// ...

// ----------------
// HtmlWebpackPlugin
config.plugins.push(new HtmlWebpackPlugin({
  // ..
  filename: path.join(__dirname, 'public/index.html'),
  template: path.join(__dirname, 'src/html/index.template.ejs'),
  inject: false,
  // inlineCSSRegex: (development) ? []
  //   : [
  //     '.css$'
  //   ],

  // ..
}));

// ...

// ----------------
// HtmlWebpackScriptsPlugin
if (!development) {
  config.plugins.push(new HtmlWebpackScriptsPlugin({
    'inline': /^runner.*.js$/, // inline runner
    'defer': /^(?!runner).*.js$/ // defer everything else
  }));
}

// ...
```

See *src/html/index.template.ejs* for how `inlineCSSRegex` can be used.

---
# What about TTFMP and splitting / inlining?
---

At this point in webpack 4 [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin) already does lot of good things that were impossible using [extract-text-webpack-plugin](https://github.com/webpack-contrib/extract-text-webpack-plugin) in webpack 3.

Sroll down for [**The big plan**](https://medium.com/webpack/the-new-css-workflow-step-1-79583bd107d7).

By using current webpack 4 tools on first visit we can get fast first paint with inlined CSS, load JS from head in *defer*, load app entry point JS from body in *async* (or *defer*), after first JS logic comes up lazy load the rest. On second visit everything is already cached. And then there is push.

---
# Next
---

We will look about some webpack plugins for getting started with TTFMP and PWA.
