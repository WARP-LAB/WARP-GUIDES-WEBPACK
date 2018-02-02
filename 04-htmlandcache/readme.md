# HTML building, asset injecting and inlining, cache busting

---
# In this section
---

* Building HTML
* Cache busting
* Inlining assets in HTML
* Minify HTML

---
# Prefligt
---

Use existing `webpacktest-devserver ` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-htmlandcache`. Make changes in `package.json` name field. Don't forget `npm install`.


---
# Remove static `index.html`
---

Just delete `public/index.html`.

And make cleaning part of our build script to remove it too.

*package.json*

```
"clean:assets": "rm -rf $(pwd)/public/assets/* && rm -rf $(pwd)/public/index.html",
```

---
# HTML building (`index.html`)
---

Till now we were using prefilled `assets/index.html` to serve the webpage. It was done two ways

* either via  `webpacktest-xxx.test(:80)` where `public/index.html` in public dir was served by *nginx*
*  or `localhost:4000` where `public/index.html` was served by webpack DevServer by specifying content base.

That introduced issues when building for development or production as we needed to go into the `public/index.html` and add or remove port number to the assets URIs. See notes in `webpacktest-devserver` guide stage.

However - we can build/generate `public/index.html` using webpack on the fly (note: *building* differs from *serving*, mkay).

And it is not only about development. Such generated `index.html` file really can be also used in production in SPAs - without backend (as this guide) or even with RESTful backend.

## Install

### html-webpack-plugin

```sh
npm install html-webpack-plugin --save-dev
```

### html-webpack-harddisk-plugin, plugin for the plugin

There are [many](https://github.com/jantimon/html-webpack-plugin#third-party-addons).

The one we will use is to emmit the generated html file in `public` directory. We could use in memory stuff, however that would introduce need for middlewares and configuration not for this guide (yet).

```sh
npm install html-webpack-harddisk-plugin --save-dev
```

### Loader for template

Many template engines [are supported](https://github.com/jantimon/html-webpack-plugin/blob/master/docs/template-option.md).

Let us just use built in [EJS](http://www.embeddedjs.com) template markup.

## Configure

Make use of `src/html/index.template.ejs` file that till now has been empty.

_src/index.template.ejs_

```ejs
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title><%= htmlWebpackPlugin.options.title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <script src="//webpacktest-htmlbuild.test/assets/preflight.js"></script>
  <link href="//webpacktest-htmlbuild.test/assets/preflight.css" rel="stylesheet" type="text/css">
  <link href="<%= htmlWebpackPlugin.files.chunks.index.css %>" rel="stylesheet" type="text/css">
</head>
<body>
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  <div class="app"></div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <script async src="<%= htmlWebpackPlugin.files.chunks.index.entry %>"></script>
</body>
</html>
```


_webpack.front.config.js_

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

// ...

// ----------------
// HtmlWebpackPlugin

config.plugins.push(new HtmlWebpackPlugin({
  title: `GUIDE - ${pConfig.name}`,
  filename: path.join(__dirname, 'public/index.html'),
  template: path.join(__dirname, 'src/html/index.template.ejs'),
  inject: false, // we specify manually where we want our entry outputs to be in the template
  // favicon: favicon.ico,
  hash: false,
  cache: true,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true,
  minify: false
}));
// HtmlWebpackHarddiskPlugin
config.plugins.push(new HtmlWebpackHarddiskPlugin());

// ...
```

## First build

Build it for dev and prod.

```sh
npm run build:front:dev
npm run build:front:prod
```

Observe how (if) `index.html` is outputted into `public` directory and is served to the browser in both cases (and inspect how port number in outputted HTML changes based on ENV).


## Cache busting by using hashes

Till now HTML always referenced to `index.js|css`. This is bad as those files in real world have to be cached. As the filenames do not change then user will not get our new webapp version! HTML building allows us to use cache busting by changing filenames of our outputs on new builds!

Currently when building HTML (and previously when doing *manual* `index.html`) the output looks something like this

```html
  <script async src="//webpacktest-htmlbuild.test/assets/index.js"></script>
```

Include chunk-specific hash in the filename for JavaScript and CSS. In development we can leave the hash out as we would develop and test site with caching off in web browser anyways (see Chrome settings *Disable cache (while Dev Tools is open)*).

*webpack.front.config.js*

```javascript
// ...

  output: {
    path: outputPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
    publicPath: outputPublicPath
  },

// ...

config.plugins.push(new ExtractTextPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  disable: development, // disable when development
  allChunks: true
}));

// ...
```

Build it for prod.

Observe outputted filenames in *assets* directory. 

Observe that built `index.html` correctly them.

```html
  <script async src="//webpacktest-htmlbuild.test/assets/index.1d945ec34689702b7722.js"></script>
```

Imagine if we would be still using selfmade `index.html`, how quite imposibble it would be to track those outputted hashnames and manually reenter themn in `index.html`.

Note that in *HtmlWebpackPlugin* we have set `hash: false`, because we do not want *HtmlWebpackPlugin* to do filename hashing, we do it it more global level using webpack.

## Inline manually managed files into HTML (`preflight`)

How about inlining inside HTML `preflight` files that currently are copied over to assets using *FileManagerPlugin*? Does avoiding two extra requests wins over having to return a bit bigger HTML? Due to their content and purpose it might be an OK idea.

Note that from the current tools that are available another approach from what we will be taking would be

* to use same `filemanager-webpack-plugin` (yes, again, this instead of `copy-webpack-plugin` because *filemanager* allows specifying actions that are executed before webpack begins the bundling process) to copy `preflight.js|css` over to output dir, just as we do it right now
* after file is copied to output dir it could be fed to `html-webpack-include-assets-plugin` that in turn would add paths for the files to `html-webpack-plugin`
* then files could be used in auto or manual injecting in template (accessibla via `htmlWebpackPlugin` object inside template).

What a hassle. Let us avoid copying files and then injecting pats to them using `html-webpack-include-assets-plugin` by creating self defined key in `HtmlWebpackPlugin`.  
Set its value to the contents(!) of `preflight` files

*webpack.front.config.js*

```javascript
// ...
const fs = require('fs');

// ...

config.plugins.push(new FileManagerPlugin({
  onStart: {
    copy: [
      // {
      //   source: path.join(__dirname, 'src/preflight/*.{js,css}'),
      //   destination: outputPath
      // }
    ],
    move: [],
    delete: [],
    mkdir: [],
    archive: []
  }
}));

// ...

// ----------------
// HtmlWebpackPlugin

config.plugins.push(new HtmlWebpackPlugin({
// ...
  fsInlineContents: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
// ...
}));
```

Now just echo out the contents in the template head.

*index.template.ejs*

```ejs
  <script><%= htmlWebpackPlugin.options.fsInlineContents['preflight.js'] %></script>
  <style><%= htmlWebpackPlugin.options.fsInlineContents['preflight.css'] %></style>
```

Note - if preflight changes (which happens few times in whole development process), webpack dev server has to be restarted.

Build and observe how file contents get inlined!

## Automatically inject entries / outputs

Right now we are specifying manually where in the template entry outputs are injected. However we can automate it (and in most situations we should).

Just change `inject` to `true`

_webpack.front.config.js_

```javascript
inject: 'body'
```

And remove those lines where we manually inject assets into the template

```ejs
<link href="<%= htmlWebpackPlugin.files.chunks.index.css %>" rel="stylesheet" type="text/css">
<script async src="<%= htmlWebpackPlugin.files.chunks.index.entry %>"></script>
```

from *index.template.ejs*.

Build and observe how assets are now automatically injected into the built HTML.

## Minify HTML and inline assets

Minify our HTML as well as that CSS state machine JS and CSS inline code when not in development.

_webpack.front.config.js_

```javascript
// ...

config.plugins.push(new HtmlWebpackPlugin({
// ...
  minify: (development)
    ? false
    : {
      minifyJS: true,
      minifyCSS: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true
    } // https://github.com/kangax/html-minifier#options-quick-reference
}));

// ...
```

Build for production and observe.


---
# Next
---

ES6+, using Babel
