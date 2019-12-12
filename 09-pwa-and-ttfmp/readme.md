# Progressive web application and bits on TTFMP

---
# In this section
---

* Enable TLS
* Setting up basic structure for PWA
* *manifest.json*
* Service Worker and offline caching
* preload fonts and images
* preload async chunks

---
# Preflight
---

Use existing `webpacktest-codesplitting` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-pwaandttfmp`. Make changes in `package.json` name field. Don't forget `npm install`.

---
# Why?
---

Because 💯 in *Lighthouse* makes you feel better.

---
# Enable TLS
---

Create certificate for this site

```sh
valet secure webpacktest-pwaandttfmp
```

Set development and testing tiers to be TLS

*package.json*

```json
      "development": {
        "host": "webpacktest-pwaandttfmp.test",
        "sub": "",
        "tls": true,
        "port": "4000",
        "appPathAboveRoot": ""
      },
      "testing": {
        "host": "webpacktest-pwaandttfmp.test",
        "sub": "",
        "tls": true,
        "port": "",
        "appPathAboveRoot": ""
      },
```

Webpack devserver should automatically pick up our certificates

*webpack.front.config.js*

```javascript
// ..
config.devServer = {
  // ..
  https: development && pConfig.config.tiers.development.tls
    ? {
      ca: fs.readFileSync(`${require('os').homedir()}/.valet/CA/LaravelValetCASelfSigned.pem`),
      key: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHost}.key`),
      cert: fs.readFileSync(`${require('os').homedir()}/.valet/Certificates/${targetAppHost}.crt`)
    }
    : false,
  // ..
}
// ..
```


---
# The Web App Manifest
---

Take `media/images/pwa-icon.png` and put it under `src/images/` or create your own 512x512 image.

We can easily use [some online generator](https://app-manifest.firebaseapp.com) to create `manifest.json` and icons, but this tut is about webpack. And plugin will conventionally also inject `<meta name="theme-color" content="">` into template.

```sh
npm install webpack-pwa-manifest --save-dev
```

*webpack.front.config.js*

```javascript
// ..
const WebpackPwaManifest = require('webpack-pwa-manifest'); // eslint-disable-line no-unused-vars

// ..

// ----------------
// WebpackPwaManifest
config.plugins.push(new WebpackPwaManifest({
  name: 'My Progressive Shiet',
  short_name: 'MyPWA',
  description: 'My awesome shiet!',
  background_color: '#ffff00',
  theme_color: '#ffff00',
  start_url: (development)
    ? targetAppUrlNoPort
    : '/',
  display: 'standalone',
  orientation: 'portrait',
  icons: [
    {
      src: path.join(__dirname, 'src/images/pwa-icon.png'),
      sizes: [96, 128, 192, 256, 384, 512]
    }
  ]
}));

```

Build for testing and inspect *Manifest* section of *Application* tab in *Chrome* inspector.

---
# Service worker
---

Popular webpack plugins for this are [offline-plugin](https://github.com/NekR/offline-plugin) and [serviceworker-webpack-plugin](https://github.com/oliviertassinari/serviceworker-webpack-plugin). The latter currently has issues with webpack 4 (alpha tags from Github can be used).

```sh
npm install offline-plugin --save-dev
```

*webpack.front.config.js*

```javascript
const OfflinePlugin = require('offline-plugin'); // eslint-disable-line no-unused-vars

// ..

// ----------------
// OfflinePlugin
config.plugins.push(new OfflinePlugin({
  ServiceWorker: {
    output: '../sw.js'
  }
}));

// ..
```

Inject when not in development.

*src/index.js*

```javascript
// ..

import * as OfflinePluginRuntime from 'offline-plugin/runtime'; // eslint-disable-line
if (!__DEVELOPMENT__) {
  OfflinePluginRuntime.install();
}

// ..
```

Build for testing and inspect *Service Workers* section of *Application* tab in *Chrome* inspector. I'll just leave here [link to docs](https://github.com/NekR/offline-plugin/tree/master/docs).

---
# webpack preload fonts and images
---

No plugins, template magic.

As an example we will be preloading all *woff2* fonts (although we only actually use 2 of them in app, the whole font family is defined in SCSS just as test).

And we will be preloading all images.

Attach `outputPublicPathBuilt` to *HtmlWebpackPlugin* options

*webpack.front.config.js*

```javascript
// ..

// ----------------
// HtmlWebpackPlugin
config.plugins.push(new HtmlWebpackPlugin({
  outputPublicPathBuilt,
  outputPublicPathNoPort,
  fsInlineContents: {
    'preflight.js': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.js'), 'utf8'),
    'preflight.css': fs.readFileSync(path.join(__dirname, 'src/preflight/preflight.css'), 'utf8')
  },
  inlineCSSRegex: (development) ? []
    : [
      '.css$'
    ],
  // ..
}));

// ..
```

Put preloads in head.

*src/html/index.template.ejs*

```ejs

  <!-- PRELOAD WOFF2 -->
  <%
    for (let fileName in compilation.assets) {
      const passes = /\.(woff2)$/.test(fileName);
      if (passes) {
  %>
      <link rel="preload" href="<%= htmlWebpackPlugin.options.outputPublicPathBuilt %><%= fileName %>" as="font" type="font/woff2" crossorigin="anonymous">
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
      <link rel="preload" href="<%= htmlWebpackPlugin.options.outputPublicPathBuilt %><%= fileName %>" as="image">
  <%
      }
    }
  %>
  <!-- // PRELOAD IMAGES -->

```

Build and inspect outputted HTML head.

---
# webpack preload async chunks
---

We are going to use [preload-webpack-plugin](https://github.com/GoogleChromeLabs/preload-webpack-plugin).

Note *@next* as stable has issues with webpach 4

```sh
npm install preload-webpack-plugin@next --save-dev
```

*webpack.front.config.js*

```jsvascript
const PreloadWebpackPlugin = require('preload-webpack-plugin'); // eslint-disable-line no-unused-vars

// ..

// ----------------
// PreloadWebpackPlugin
if (!development) {
  config.plugins.push(new PreloadWebpackPlugin({
    include: 'asyncChunks',
    rel: 'preload'
  }));
}

// ..
```

Build for testing tier and inspect outputted HTML head. 

---
# HTTP/2 Server Push
---

Out of scope for this tut, it is not about webpack.

---
# TTFMP
---

Per project strategy. Shocker! But IMHO these hints are a good start.

---
# Next
---

We will look at some basic *React* as well as *CSS modules* setup. However at this point - start coding!
