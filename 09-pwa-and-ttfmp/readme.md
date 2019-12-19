# Progressive web application and bits on TTFMP

---
# In this section

* Serverside and TLS
* Valet or warp-serve-localhost
* Web App Manifest
* Service worker
* Test offline and Audit
* Preload links
* Preload async chunks

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-08-analysis-code-splitting`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-09-pwa-and-ttfmp`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

```sh
cd webpacktest-09-pwa-and-ttfmp
npm install
```

---
# Why?

Because practical needs or maybe 💯 in *Lighthouse* makes one feel better.

It might be a good idea to read webpack's own guide to [Progressive Web Application](https://webpack.js.org/guides/progressive-web-application/) which uses [Google's Workbox](https://developers.google.com/web/tools/workbox/guides/precache-files/webpack) as example.  Creating strategy from scratch might be a good idea for a serious PWA, this tutorial however will use ready plugins that simply enable features.

**Disable *analyse* if enabled.**

---
# Serverside and TLS

This chapter needs some kind of serverside to observe the results. And TLS is also recommended.

There are two possibilities that this tut looks at

* Valet
* A simple Node.js server

## Valet

Creating certificate for this site (assuming that `webpacktest-09-pwa-and-ttfmp` is within Valet *parked* directory).

```sh
valet secure webpacktest-09-pwa-and-ttfmp
```

And that's it. 

When building for testing (or actually any nondevelopment) tier, specify correct *fqdn*

_properties.json_

```json
{
    "testing": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": true,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
```

```sh
npm run front:build:test
```

App should be available at [https://webpacktest-09-pwa-and-ttfmp.test](https://webpacktest-09-pwa-and-ttfmp.test). Note that it uses HTTP2 if TLS is on.

If Valet is set up webpack DevServer can also be built with Valet domain and TLS and should automatically pick up and use Valet certificates (see `config.devServer.https`).

_properties.json_

```json
{
    "development": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": true,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
```

```sh
npm run front:dev:static
```

* [https://webpacktest-09-pwa-and-ttfmp.test:4000](https://webpacktest-09-pwa-and-ttfmp.test:4000)
* [https://webpacktest-09-pwa-and-ttfmp.test](https://webpacktest-09-pwa-and-ttfmp.test) works too as `Access-Control-Allow-Origin` is set

## warp-serve-localhost

This repo contains directory named `warp-serve-localhost`. It contains a really simple Node.js server that can be used if Valet is not set up.

### Create certificates for localhost

In not first then second Google hit will tell how to create self signed certificates for localhost app development. Note that later when everything is set up one should allow browser to open localhost (trust those self signed certs). Also setting [chrome://flags/#allow-insecure-localhost](chrome://flags/#allow-insecure-localhost) might be a good idea.

`warp-serve-localhost/generate-localhost-certificates` also contains stuff can be used to create such certs.

### Add server to project

Copy `warp-serve-localhost/warp-serve-localhost.js` to `webpacktest-09-pwa-and-ttfmp`.

### Configure project

Add npm script *helpers*

_package.json_

```json
    "front:serve:test": "node $(pwd)/warp-serve-localhost.js --tier=testing",
    "front:serve:stage": "node $(pwd)/warp-serve-localhost.js --tier=staging",
    "front:serve:prod": "node $(pwd)/warp-serve-localhost.js --tier=production",
```

Check/edit *warp-serve-localhost.js* to reflect paths to certificates created previously (`httpsOptions` object).

Edit testing and development tier information

_properties.json_

```json
{
    "development": {
      "fqdn": "localhost",
      "tls": true,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "testing": {
      "fqdn": "localhost",
      "tls": true,
      "port": "3003",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
```

### Build and serve

```sh
npm run front:build:test
npm run front:serve:test
```

App should be available at [https://localhost:3003](https://localhost:3003). Note that it uses HTTP2 if TLS is on (can be configured).

DevServer can also now be run with TLS, should automatically pick up and use localhost certificates (see `config.devServer.https` to change paths).

```sh
npm run front:dev:static
```

App should be available at [https://localhost:4000](https://localhost:4000). Note that it currently does not support HTTP2.

### Next

In the following sections usage of *warp-serve-localhost* is assumed, thus

```sh
npm run front:build:test
npm run front:serve:test
```

routine. Note also that `npm run front:serve:test` can be run in some none blocking way (say in *screen*) and kept alive, no need to stop and restart it after every `npm run front:build:test`.

The routine can be shortened to 

```sh
npm run front:build:test
```

if Valet us used.

*properties.json* tiers have to be configured accordingly.

---
# Web App Manifest

## Intro

[Google take on The Web App Manifest](https://developers.google.com/web/fundamentals/web-app-manifest). It may be confusing in context ow webpack, as it also has a concept named *Manifest*, which was discussed previously.

Run for testing

```sh
npm run front:build:test
npm run front:serve:test # if not running in backround
```

Opening [https://localhost:3003](https://localhost:3003) and inspecting *Manifest* section of *Application* tab in *Chrome* inspector yields *No manifest detected*.

## Install

_properties.json_

```json
  "pwa": true,
```

Use `media/images/pwa-icon.png` and put it under `src/images/`.

Using [webpack-pwa-manifest](https://github.com/arthurbergmz/webpack-pwa-manifest).

```sh
npm install webpack-pwa-manifest --save-dev
```

Filling in keys according to [WebAppManifest dictionary](https://w3c.github.io/manifest/#webappmanifest-dictionary), plus plugin specific keys.

_webpack.front.config.js_

```javascript
// ..
const WebpackPwaManifest = require('webpack-pwa-manifest'); // eslint-disable-line no-unused-vars

// ..

// HtmlWebpackPlugin - WebpackPwaManifest
if (appProps.pwa) {
  config.plugins.push(new WebpackPwaManifest({
    // ----------------
    // https://w3c.github.io/manifest/#webappmanifest-dictionary
    lang: 'en',
    dir: 'ltr',
    name: 'My Progressive Shiet',
    short_name: 'MyPWA',
    description: 'My awesome shiet!',
    // scope: '',
    // icons: [], // use plugin to generate
    display: 'standalone',
    orientation: 'portrait',
    start_url: (!appPathUrlBasePublicPath) ? '.' : appPathUrlBasePublicPath,
    theme_color: '#ffff00',
    // related_applications: [],
    // prefer_related_applications: false,
    background_color: '#ffff00',
    categories: ['entertainment'], // https://github.com/w3c/manifest/wiki/Categories
    // screenshots: [],
    // iarc_rating_id: '',
    // shortcuts: [],
    // ----------------
    // WebpackPwaManifest specific
    // filename: 'manifest.json', // use hashing
    crossorigin: 'anonymous',
    inject: true,
    fingerprints: true,
    ios: true,
    publicPath: appPathUrlBuildPublicPath,
    includeDirectory: true,
    icons: [
      {
        src: path.resolve(__dirname, 'src/images/pwa-icon.png'),
        sizes: [96, 128, 192, 256, 384, 512],
        ios: true
      }
    ]
  }));
}

// ...

```


Use `media/images/favicon.ico` and put it under `src/images/`.


_webpack.front.config.js_

```javascript

// ...

config.plugins.push(new HtmlWebpackPlugin({
	// ...
	favicon: path.resolve(__dirname, 'src/images/favicon.ico'),
	// ...
}));

// ...

```

## Test

Build

```sh
npm run front:build:test
npm run front:serve:test # if not running in backround
```

[https://localhost:3003/](https://localhost:3003/)

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector yields that manifest is detected, however no *matching service worker detected*.

## Note on local filesystem

After building open `public/index.html` from filesystem.

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector yields *No manifest detected*.

Console explains why

```
Access to resource at 'file://.../webpacktest-09-pwa-and-ttfmp/public/assets/manifest.7d3c8fd09adeffbbb8be164be7dfa394.json' from origin 'null' has been blocked by CORS policy: Cross origin requests are only supported for protocol schemes: http, data, chrome, chrome-extension, https.
```

See `--allow-file-access-from-files`, for other-than-Chrome browsers it is managed differently. This is one of reasons why this chapter benefits from having a devserver.

---
# Service worker

## Intro

One should set service worker JavaScript to be physically at application root (`/public`) for this tutorial.  
If it was outputted in assets (`/public/assets`) then application root would be [out of scope](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) for the worker and it will failed to register.  
Note that it could be physically left in `/public/assets`, however in that case `Service-Worker-Allowed` header would have to be added on serverside (*nginx*, *Apache*, *warp-serve-localhost*, ...) or some *rewrite* set that file is served from app root (*virtually* moving it to root for correct scope).

## Install

A popular webpack plugin for this is [offline-plugin](https://github.com/NekR/offline-plugin).

```sh
npm install offline-plugin --save-dev
```

## Configure

_webpack.front.config.js_

```javascript
const OfflinePlugin = require('offline-plugin'); // eslint-disable-line no-unused-vars

// ...

// ----------------
// OfflinePlugin
if (appProps.pwa) {
  config.plugins.push(new OfflinePlugin({
    ServiceWorker: {
      output: '../sw.js', // move out from public/assets to public/
      // publicPath: `/${appUrlPathAboveServerRoot}sw.js`,
      scope: appPathUrlBasePublicPath,
      entry: path.resolve(__dirname, 'src/sw.js'),
      minify: !(development),
      events: true
    },
    AppCache: false,
    publicPath: appPathUrlBuildPublicPath,
    responseStrategy: 'cache-first',
    caches: 'all',
    updateStrategy: 'changed'
  }));
}

// ...
```

Inject when not in development.

_src/index.js_

```javascript
// ..

import * as OfflinePluginRuntime from 'offline-plugin/runtime';
OfflinePluginRuntime.install({
  onInstalled: () => {
    console.log('SW Event:', 'onInstalled');
  },
  onUpdating: () => {
    console.log('SW Event:', 'onUpdating');
  },
  onUpdateReady: () => {
    console.log('SW Event:', 'onUpdateReady');
    OfflinePluginRuntime.applyUpdate();
  },
  onUpdated: () => {
    console.log('SW Event:', 'onUpdated');
    // window.location.reload(false);
  },
  onUpdateFailed: () => {
    console.log('SW Event:', 'onUpdateFailed');
  }
});

// ..
```

## Build

Build

```sh
npm run front:build:test
npm run front:serve:test # if not running in backround
```

[https://localhost:3003/](https://localhost:3003/)

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector yields that manifest is set up.


---
# Test offline and Audit

Run server (if not Valet)

```sh
npm run front:serve:test # if not running in backround
```

Load the page [https://localhost:3003/](https://localhost:3003/). 

Either stop server or use *Offline* in *Service Workers* section of *Application* tab in *Chrome* inspector. Reload the page, all assets are cached and served offline.

Run *Audits* tab in *Chrome* inspector or 

```sh
npm install -g lighthouse

lighthouse --emulated-form-factor=desktop --throttling-method=provided --view https://localhost:3003/

# or

lighthouse --emulated-form-factor=desktop --throttling-method=provided --view https://webpacktest-09-pwa-and-ttfmp.test
```

---
# Preload links

No plugins, template magic.

As an example all images will be hinted for preload.

_src/html/index.template.ejs_

```ejs

  <% for (let fileName in compilation.assets) { %>
    <% const passes = /\.(png|jpe?g|gif)$/.test(fileName); %>
    <% if (passes) { %>
      <link rel="preload" href="<%= webpackConfig.output.publicPath %><%= fileName %>" as="image">
    <% } %>
  <% } %>
  
```

Build and inspect outputted HTML head and network timeline.

---
# Preload async chunks

[`<link rel=”prefetch/preload”> in webpack`](https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c)

_src/index.js_

```javascript

// Lazy load something
import(
  /* webpackChunkName: "helpers.lazy.one" */
  /* webpackPreload: true */
  'extras/helpers.lazy.one.js'
).then((module) => {
  module.helperLazyOne();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyOne', error);
});

```

---
# HTTP/2 Server Push

Out of scope for this tut, it is not about webpack.

---
# TTFMP

Per project strategy. Shocker! But IMHO some hints above may be a good start.

---
# Result

See `webpacktest-09-pwa-and-ttfmp` directory.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

---
# Next

We will look at some basic *React* as well as *CSS modules* setup. However at this point - start coding!
