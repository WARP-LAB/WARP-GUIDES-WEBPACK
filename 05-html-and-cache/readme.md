# HTML building, asset injecting and inlining, cache busting

---
# In this section

* HTML building
* Cache busting by using hashes
* Inline manually managed files into HTML
* Minify HTML including inlined code

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-04-devserver`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-05-html-and-cache`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`.

```sh
cd webpacktest-05-html-and-cache
npm install
```
---
# Remove `public/index.html`

Delete `public/index.html`.

Change cleaning npm script to remove it too.

_package.json_

```
    "clean:assets": "rm -rf $(pwd)/public/index.html && rm -rf $(pwd)/public/assets/**"
```

---
# HTML building

Till now a *manual* `assets/index.html` to serve the webpage was used.

That introduced issues when building for development (utilising webpack DevServer) and testing tiers as one needed to manually change *src/href* values in `public/index.html` as shown in previous chapter.

It is possible to build/generate `public/index.html` using webpack on the fly (note: *building* differs from *serving*).

It is not only about development. Such generated `index.html` file really can be also used in staging and production tiers. Moreover the generated file can be actually some serverside template engine file that is then read by serverside app before dynamically serving it to the client (i.e. `index.php`).

## Install

### html-webpack-plugin

[html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin)

```sh
npm install html-webpack-plugin --save-dev
```

### html-webpack-harddisk-plugin

There are [many](https://github.com/jantimon/html-webpack-plugin#plugins) plugins that extend *html-webpack-plugin*.

The one used is [html-webpack-harddisk-plugin](https://github.com/jantimon/html-webpack-harddisk-plugin) which emits the generated html file in `public/` directory also when webpack DevServer is used.

```sh
npm install html-webpack-harddisk-plugin --save-dev
```

### HTML template engine

Many template engines [are supported](https://github.com/jantimon/html-webpack-plugin/blob/master/docs/template-option.md).

Using built in [lodash](https://github.com/lodash/lodash) template markup.
[html-webpack-template/index.js](https://github.com/jaketrent/html-webpack-template/blob/master/index.ejs) gives info what data gets exposed.

## Configure

Making use of `src/html/index.template.ejs` file that till now has been empty.  
Explicitly define locations for CSS and JS.

_src/index.template.ejs_

```ejs
<!DOCTYPE html>
<html lang="en" class="noscript incapable">
<head>
  <meta charset="utf-8">
  <title><%= htmlWebpackPlugin.options.title || 'My Title' %></title>
  <meta name="description" content="Webpack Guide">
  <meta name="keywords" content="webpack,guide">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
  <script src="<%= htmlWebpackPlugin.options.props.appPathUrlBuildPublicPath %>preflight.js"></script>
  <link href="<%= htmlWebpackPlugin.options.props.appPathUrlBuildPublicPath %>preflight.css" rel="stylesheet" type="text/css">
  <% for (let key in htmlWebpackPlugin.files.css) { %>
    <link href="<%= htmlWebpackPlugin.files.css[key] %>" rel="stylesheet" type="text/css">
  <% } %>
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
  <div class="app"> Loading... </div>
  <script>
    window.__TEMPLATE_DATA__ = {};
  </script>
  <% for (let key in htmlWebpackPlugin.files.chunks) { %>
    <script src="<%= htmlWebpackPlugin.files.chunks[key].entry %>"></script>
  <% } %>
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
  // add user defined object to hold extra values to pass to template
  props: {
    appPathUrlBuildPublicPath
  },
  //
  title: `GUIDE - ${require(path.resolve(__dirname, 'package.json')).name}`,
  filename: path.join(__dirname, 'public/index.html'),
  template: path.resolve(__dirname, 'src/html/index.template.ejs'),
  // templateParameters: false,
  inject: false, // currently specify manually entry outputs in template
  // favicon: favicon.ico,
  // meta: {},
  // base: false,
  hash: false, // done at global level
  cache: true,
  showErrors: true,
  // chunks: [],
  chunksSortMode: 'auto',
  excludeChunks: [],
  xhtml: false,
  alwaysWriteToDisk: true, // HtmlWebpackHarddiskPlugin
  minify: false
}));
// HtmlWebpackPlugin - HtmlWebpackHarddiskPlugin
config.plugins.push(new HtmlWebpackHarddiskPlugin());

// ...
```

## First build

Building for different tiers.

```sh
npm run front:dev:serve
npm run front:dev:static
npm run front:build:dev
npm run front:build:test
```

`src/index.template.ejs` is compiled and outputted to `public/index.html` which is then consumed in browser according to tier (opened via local filesystem or [http://localhost:4000/](http://localhost:4000/) or [http://webpacktest-05-html-and-cache.test/](http://webpacktest-05-html-and-cache.test/)).

---
# Cache busting by using hashes

Till now HTML has always referenced to `index.(js|css)`. As the filenames do not change then user will not get new webapp version if the files are cached. HTML building allows to use cache busting by changing filenames of built products.

Currently when building HTML (and previously when doing *manual* `index.html`) the built output looks something like this

```html
  <script src="assets/index.js"></script>
```

Including chunk-specific hash in the filename for JavaScript and CSS. In development hashing can be left out as developing should be done with caching turned off for browser anyways.

webpack documentation on [caching](https://webpack.js.org/guides/caching/) and [possible placeholders](https://webpack.js.org/configuration/output/#outputfilename).

_webpack.front.config.js_

```javascript
// ...

  output: {
    path: appPathFsBuild,
    publicPath: appPathUrlBuildPublicPath,
    filename: (development) ? '[name].js' : '[name].[chunkhash].js',
  },

// ...

// ----------------
// MiniCssExtractPlugin
config.plugins.push(new MiniCssExtractPlugin({
  filename: (development) ? '[name].css' : '[name].[chunkhash].css',
  chunkFilename: (development) ? '[id].css' : '[id].[chunkhash].css',
}));

// ...
```

Build for testing.

```sh
npm run front:build:test
```

Outputted filenames in *public/assets/* directory contain hash.  
The built `public/index.html` correctly references them.

If a change is made in code, i.e., `src/index.js` and app is built again, the hash changes.

Note that *webpack.front.config.js* sets *HtmlWebpackPlugin* to `hash: false` as *HtmlWebpackPlugin* should not hash anything, it is done on global level using webpack.

---
# Inline manually managed files into HTML (`preflight`)

Note that proper inlining for *built assets* will be discussed later in code splitting section. This is a special road taken for CSS state machine, webpack runtime should be nowhere near these files.

It is possible to inline `preflight` files inside HTML, files that currently are copied over to `public/assets` using *CopyPlugin*. Does avoiding two extra requests wins over having to return a bit bigger HTML? Due to their content and purpose is inlining reasonable? Yes.

From current [list of plugins](https://github.com/jantimon/html-webpack-plugin#plugins) no one does exactly what needed. It is possible to achieve the goal by combining multiple plugins together. It is much more straight forward to inject *preflight* sources manually.

## Configure

_webpack.front.config.js_

```javascript
// ...

const fs = require('fs');

// ...

// // ----------------
// // CopyPlugin
// config.plugins.push(new CopyPlugin([
//   {
//     from: path.join(__dirname, 'src/preflight/*.{js,css}'),
//     to: appPathFsBuild,
//     flatten: true,
//     toType: 'dir'
//   }
// ]));

// ...

// ----------------
// HtmlWebpackPlugin
config.plugins.push(new HtmlWebpackPlugin({
  // add user defined object to hold extra values to pass to template
  props: {
    appPathUrlBuildPublicPath,
    inlineContents: {
      'preflight.js': fs.readFileSync(path.resolve(__dirname, 'src/preflight/preflight.js'), 'utf8'),
      'preflight.css': fs.readFileSync(path.resolve(__dirname, 'src/preflight/preflight.css'), 'utf8')
    }
  },
// ...
}));
```

Echoing out the contents in the template head.

_index.template.ejs_

```ejs
  <!--
  <script src="<%= htmlWebpackPlugin.options.props.appPathUrlBuildPublicPath %>preflight.js"></script>
  <link href="<%= htmlWebpackPlugin.options.props.appPathUrlBuildPublicPath %>preflight.css" rel="stylesheet" type="text/css">
  -->
  <script><%= htmlWebpackPlugin.options.props.inlineContents['preflight.js'] %></script>
  <style><%= htmlWebpackPlugin.options.props.inlineContents['preflight.css'] %></style>
```

If code of preflight state machine changes (which, if even, then happens few times during whole development process), webpack DevServer has to be restarted.

## Build

```sh
npm run front:build:test
```

*preflight* is inlined in *public/index.html* head.

---
# Minify HTML including inlined code

Minify HTML as well as inlined *preflight* javaScript and CSS when not in development. [Documentation](https://github.com/jantimon/html-webpack-plugin#minification).

## Configure

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
    } // https://github.com/DanielRuf/html-minifier-terser#options-quick-reference
}));

// ...
```

## Build

```sh
npm run front:build:test
```

*public/index.html* is minified.

---
# Result

See `webpacktest-05-html-and-cache` directory.  
Images and fonts have to be copied to `src/..` from `media/..`.

---
# Next

ES6+, using Babel
