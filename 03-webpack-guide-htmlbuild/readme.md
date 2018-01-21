# WEBPACK BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# PREFLIGHT
---

Use existing `webpacktest-devserver` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-htmlbuild`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-htmlbuild.dev`.

---
# HTML building (`index.html`)
---

Till now we were using prefilled `assets/index.html` to serve the webpage. It was done two ways

* either via  `webpacktest-xxx.dev(:80)` where `public/index.html` in public dir was served by *nginx*
*  or `localhost:4000` where `public/index.html` was served by webpack dev server by specifying content base.

That intriduced issues when building for development or production as we needed to go into the `public/index.html` and add or remove port number to the assets URIs. See notes in `webpacktest-devserver` guide stage.

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

Make use of `src/index.template.ejs` file that till now has been empty.

_src/index.template.ejs_

```ejs
<!DOCTYPE html>
<html class="noscript">
<head>
  <meta charset="utf-8">
  <title><%= htmlWebpackPlugin.options.title %></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="<%= htmlWebpackPlugin.files.chunks.preflight.entry %>"></script>
  <link rel="stylesheet" type="text/css" href="<%= htmlWebpackPlugin.files.chunks.site.css %>">
</head>
<body>
  <div class="app"></div>
  <script>
    var dataReact = {};
  </script>
  <script async src="<%= htmlWebpackPlugin.files.chunks.site.entry %>"></script>
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
  template: 'src/index.template.ejs',
  inject: false, // we specify manually where we want our entry outputs to be in the template
  // favicon: ,
  minify: false,
  hash: false,
  cache: true,
  showErrors: true,
  // chunks: ['site', 'preflight'],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true
}));
config.plugins.push(new HtmlWebpackHarddiskPlugin());
```

## Build

Build it for dev and prod. Observe how (if) `index.html` is outputted into `public` directory and served to the browser in both cases.

