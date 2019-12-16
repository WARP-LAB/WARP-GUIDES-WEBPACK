# Progressive web application and bits on TTFMP

---
# In this section

* Enable TLS
* Setting up basic structure for PWA
* *manifest.json*
* Service Worker and offline caching
* preload fonts and images
* preload async chunks

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-08-analysis-code-splitting`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-09-pwa-and-ttfmp`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`.

```sh
cd webpacktest-09-pwa-and-ttfmp
npm install
```

---
# Why?

Because practical needs or maybe 💯 in *Lighthouse* makes one feel better.

---
# Enable TLS

This is assuming that Valet is used.

Creating certificate for this site

```sh
valet secure webpacktest-09-pwa-and-ttfmp
```

webpack DevServer should also automatically pick up certificates

_webpack.front.config.js_

```javascript
// ..

config.devServer = {
  
  // ...
  
  // https: false,
  https: development && currTierProps.tls
    ? {
      ca: fs.readFileSync(`${require('os').homedir()}/.config/valet/CA/LaravelValetCASelfSigned.pem`),
      key: fs.readFileSync(`${require('os').homedir()}/.config/valet/Certificates/${appFqdn}.key`),
      cert: fs.readFileSync(`${require('os').homedir()}/.config/valet/Certificates/${appFqdn}.crt`)
    }
    : false,
    
  // ..
  
}

// ..
```

If Valet is not used, then one has to manage the certificates on your own.

Seting development and testing tiers to be TLS and using FQDN that is autoprovided by Valet.

_properties.json_

```json
{
  "useProtocolRelativeUrls": false,
  "tiers": {
    "development": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": true,
      "port": "4000",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "testing": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": true,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "staging": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": false,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    },
    "production": {
      "fqdn": "webpacktest-09-pwa-and-ttfmp.test",
      "tls": true,
      "port": "",
      "appPathUrlAboveServerRoot": "",
      "relativeUrlType": false
    }
  }
}

```

Build for webpack DevServer and testing

```sh
npm run front:dev:static
npm run front:build:test
```

[https://webpacktest-09-pwa-and-ttfmp.test](https://webpacktest-09-pwa-and-ttfmp.test)

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector.

*No manifest detected*.

---
# Web App Manifest

[Google take on the topic](https://developers.google.com/web/fundamentals/web-app-manifest).

Use `media/images/pwa-icon.png` and put it under `src/images/`.

Using [webpack-pwa-manifest](https://github.com/arthurbergmz/webpack-pwa-manifest).

```sh
npm install webpack-pwa-manifest --save-dev
```

_webpack.front.config.js_

```javascript
// ..
const WebpackPwaManifest = require('webpack-pwa-manifest'); // eslint-disable-line no-unused-vars

// ..

// ----------------
// WebpackPwaManifest
if (!development) {
  config.plugins.push(new WebpackPwaManifest({
    name: 'My Progressive Shiet',
    short_name: 'MyPWA',
    description: 'My awesome shiet!',
    background_color: '#ffff00',
    theme_color: '#ffff00',
    start_url: (development)
      ? appPathUrlBaseNoPort
      : `/${appUrlPathAboveServerRoot}`,
    display: 'standalone',
    orientation: 'portrait',
    icons: [
      {
        src: path.resolve(__dirname, 'src/images/pwa-icon.png'),
        sizes: [96, 128, 192, 256, 384, 512]
      }
    ]
  }));
}

```

Build for testing

```sh
npm run front:build:test
```

[https://webpacktest-09-pwa-and-ttfmp.test](https://webpacktest-09-pwa-and-ttfmp.test)

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector.

Manifest is detected, however no *matching service worker detected*.

---
# Service worker

Popular webpack plugins for this are [offline-plugin](https://github.com/NekR/offline-plugin), [serviceworker-webpack-plugin](https://github.com/oliviertassinari/serviceworker-webpack-plugin), and there are more.

```sh
npm install offline-plugin --save-dev
```

_webpack.front.config.js_

```javascript
const OfflinePlugin = require('offline-plugin'); // eslint-disable-line no-unused-vars

// ...

// ----------------
// OfflinePlugin
if (!development) {
  config.plugins.push(new OfflinePlugin({
    ServiceWorker: {
      output: '../sw.js'
    }
  }));
}

// ...
```

Inject when not in development.

_src/index.js_

```javascript
// ..

import * as OfflinePluginRuntime from 'offline-plugin/runtime'; // eslint-disable-line
if (!__DEVELOPMENT__) {
  OfflinePluginRuntime.install();
}

// ..
```

Build for testing

```sh
npm run front:build:test
```

[https://webpacktest-09-pwa-and-ttfmp.test](https://webpacktest-09-pwa-and-ttfmp.test)

Inspecting *Manifest* section of *Application* tab in *Chrome* inspector.

*Manifest* is set up.

---
# webpack preload fonts and images

No plugins, template magic.

As an example all *woff2* fonts will be peloaded (although only actually 2 are used in app) as well as images.

_src/html/index.template.ejs_

```ejs

  <!-- PRELOAD WOFF2 -->
  <%
    for (let fileName in compilation.assets) {
      const passes = /\.(woff2)$/.test(fileName);
      if (passes) {
  %>
      <link rel="preload" href="<%= webpackConfig.output.publicPath %><%= fileName %>" as="font" type="font/woff2" crossorigin="anonymous">
  <%
      }
    }
  %>
  <!-- // PRELOAD WOFF2 -->

  <!-- PRELOAD IMAGES -->
  <%
    for (let fileName in compilation.assets) {
      const passes = /\.(png|jpe?g|gif)$/.test(fileName);
      if (passes) {
  %>
      <link rel="preload" href="<%= webpackConfig.output.publicPath %><%= fileName %>" as="image">
  <%
      }
    }
  %>
  <!-- // PRELOAD IMAGES -->


```

Build and inspect outputted HTML head.

---
# webpack preload async chunks

[`<link rel=”prefetch/preload”> in webpack`](https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c)

```javascript
// Lazy load something
import(/* webpackChunkName: "helpers.lazy", webpackPrefetch: true */ './helpers/helpers.lazy.js').then((module) => {
  module.helperLazyB();
}).catch((error) => {
  console.log('An error occurred while loading helperLazyB', error);
});

````

At some point current template `src/html/index.template.ejs` also has to be extended, see [the base reference](https://github.com/jaketrent/html-webpack-template/blob/master/index.ejs).

---
# HTTP/2 Server Push

Out of scope for this tut, it is not about webpack.

---
# TTFMP

Per project strategy. Shocker! But IMHO these hints are a good start.

---
# Result

See `webpacktest-09-pwa-and-ttfmp` directory.  
Images and fonts have to be copied to `src/..` from `media/..`.

---
# Next

We will look at some basic *React* as well as *CSS modules* setup. However at this point - start coding!
