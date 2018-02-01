# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# PREFLIGHT
---

Use existing `webpacktest-devserver` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-htmlbuild`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-htmlbuild.test`.

---
# HTML building (`index.html`)
---

Till now we were using prefilled `assets/index.html` to serve the webpage. It was done two ways

* either via  `webpacktest-xxx.test(:80)` where `public/index.html` in public dir was served by *nginx*
*  or `localhost:4000` where `public/index.html` was served by webpack dev server by specifying content base.

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

To use for example [pug](https://pugjs.org/api/getting-started.html) we would set up this something like this

```sh
npm install pug --save-dev
npm install pug-loader --save-dev
```

and use some `src/index.template.pug` file as template and specify `template: '!!pug-loader!src/index.template.pug'`

## Configure

Put aside our `assets/index.html` by renaming it to `assets/index-manual-approach.html`

Make use of `src/html/index.template.ejs` file that till now has been empty.

_src/index.template.ejs_

```ejs
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title><%= htmlWebpackPlugin.options.title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <!--
  <script src="//webpacktest-htmlbuild.test/assets/preflight.js"></script>
  <link href="//webpacktest-htmlbuild.test/assets/preflight.css" rel="stylesheet" type="text/css">
  -->
  <link href="<%= htmlWebpackPlugin.files.chunks.index.css %>" rel="stylesheet" type="text/css">
</head>
<body>
  <!--
  <noscript>
    <div class="noscript">
      Lynx FTW!
    </div>
  </noscript>
  <div class="incapable">
    Incapable :(
  </div>
  -->
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
  title: `WEBPACK GUIDE - ${pkgConfig.name}`,
  filename: `${path.join(__dirname, 'public')}/index.html`,
  template: 'src/html/index.template.ejs',
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
config.plugins.push(new HtmlWebpackHarddiskPlugin());
```

## Build

Build it for dev and prod. Observe how (if) `index.html` is outputted into `public` directory and is served to the browser in both cases.

## Add manual files (`preflight`)

At this point it should be clear that having `preflight.js` and `prefilgt.css` in our entry is an issue due to their content and purpose. It cannot be wrapped inside webpack runtime, code has to be plain and simple stuff that can execute on vanilla IE8.

Note that from the current tools that are available one approach would be to use `filemanager-webpack-plugin` (yes, again, this instead of `copy-webpack-plugin` because *filemanager* allows specifying actions that are executed before webpack begins the bundling process). After file is copied to output dir it could be fed to `html-webpack-include-assets-plugin` that in turn would add path of the files to `html-webpack-plugin`, which can be used in auto or manual injecting in template (accessibla via `htmlWebpackPlugin` object inside template). What a hassle.

We will do change in our webpack config - simply *inline* the files to the template. No refs, no extra request for this minimalistic CSS state machine.

Let us create a custom key in `HtmlWebpackPlugin`, set its value to the contents(!) of `preflight` files.

*webpack.front.config.js*

```javascript
// ...
const fs = require('fs');
// ...
config.plugins.push(new HtmlWebpackPlugin({
// ...
  cache: false,
// ...
  fsInlines: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
// ...
}));
```

Now just echo out the contents in the template head. Yes, we want our preflight to be inlined in this case.

*index.template.ejs*

```ejs
  <script><%= htmlWebpackPlugin.options.fsInlines['preflight.js'] %></script>
  <style><%= htmlWebpackPlugin.options.fsInlines['preflight.css'] %></style>
```

Note that this change means that webpack-dev-server will not serve these files (it already doesn't, as discussed before), but that is not an issue, because preflight changes maybe 2 times in project development lifecycle. If preflight changes, webpack dev server has to be restarted.

Build and observe.

## Add hashes to output

Include chunk-specific hash in the filename for JavaScript and CSS.

*webpack.front.config.js*

```javascript
// ...

  output: {
    path: outputPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
    publicPath: publicPath
  },

// ...

config.plugins.push(new ExtractTextPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  disable: development, // disable when development
  allChunks: true
}));

// ...
```

Build it for prod. Observe outputted filenames in *assets* directory, observe that outputted `index.html` tracks them.


## Inject

Right now we are specifying manually where in the template entry outputs are injected. However we can automate it.

Just change `inject` to `true`

_webpack.front.config.js_

```javascript
inject: true
```

And remove 

```ejs
<link href="<%= htmlWebpackPlugin.files.chunks.index.css %>" rel="stylesheet" type="text/css">
<script async src="<%= htmlWebpackPlugin.files.chunks.index.entry %>"></script>
```

from *index.template.ejs*.

Build and observe.

## Minify

Minify our HTML as well as that CSS state machine JS and CSS inline code when not in development.

_webpack.front.config.js_

```javascript
config.plugins.push(new HtmlWebpackPlugin({
// ...
  minify: (development || testing)
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
// ...
}));
```