# WEBPACK BEGINNERS GUIDE

## About

This is a quick, on demand and yet unedited/untested guide how to set up [webpack](https://webpack.js.org) build system (in the moment you drop [gulp](http://gulpjs.com) on when you haven't used any building/packing system before).

Originally this was written in times when webpack just came out and documentation, both official as well as users', was sparse and bad. Now there are many excellent *Hello World* as well as in in-depth tutorials on webpack. Many projects offer boilerplates to stydy from. But I try to keep this up to date anyways.

Put together by @kroko for the new colleagues that see webpack for the first time. However I tried to formulate things in a way so that other random readers may also benefit.  
_While doing edits I realised that notes should be made for some basic npm stuff as the reality is - there are people who haven't used any building tools or even npm before (not-Node.js backend guys - PHP/ROR/... - leaning towards full stack of frontend), but want to jump in webpack. So this assumes entry level knowledge in Node/NPM._

## Chapters

### 1. webpack says *Hello World*

* OS requirements
* Directory structure
* npm
* Server side
* First build of JavaScript
* Webpack mode, deploy tiers and environments (`NODE_ENV`)
* JavaScript modules and webpack resolve alias
* Minimise JavaScript with custom options
* Copy files to destination without compiling
* First build of SCSS/CSS
* Scope hoisting
* Define plugin
* npm scripts

### 2. SCSS, CSS, PostCSS settings

* PostCSS
* Bootstrapping CSS with *normalize.css*
* CSS source maps
* Making SCSS tier aware

### 3. File loading

* File loading
* Image compressing
* Font loading (example for old bulletproof syntax)

### 4. webpack DevServer and hot reloading

* Custom `properties.json` (helper) file
* webpack DevServer setup
* CORS
* making it hot

### 5. HTML building, asset injecting and inlining, cache busting

* HTML building
* Cache busting by using hashes
* Inline manually managed files into HTML
* Minify HTML including inlined code

### 5. Babel

* Short explanation what Babel does
* Installing Babel
* Core
* preset-env
* babelrc
* Babel loader
* Module system and Tree Shaking
* Babel polyfill and browserslist
* Babel plugins
* Other polyfills
* Shims

### 6. Linting JavaScript and CSS/SCSS

* ESLint
* JavaScript Standard Style with ;
* Stylelint

### 7. Analysing bundle and code chunk splitting

* Analysing the built product by webpack
* The issue that code splitting solves
* Introducing extra entry point
* Introducing lazy loading
* Code splitting setup
* Different approaches - common, vendor, runtime (manifest) chunks
* Keeping the chunkhashes under control for caching
* Lazy loading, naming lazy loaded chunks
* Inlining runtime (manifest)

### 8. PWA and TTFMP

* Enable TLS
* Setting up basic structure for PWA
* *manifest.json*
* Service Worker and offline caching
* preload fonts and images
* preload async chunks

### Assumptions

* As of writing webpack version is 4.41.2.

### Node.js / npm version

Latest LTS, at least `node` version 8.x+, `npm` version 5.7.1+  (note that webpack 5 will drop support for `node` 8 and will support 10.13+)
This tut has been tested on node 12.13.1 / npm 6.13.2.

### Todo / notes to self

* Expand on TTFMP stuff
* Expand on PWA stuff
* Discuss how *webpack-dev-server* can be launched via API

### License

[The MIT License](https://raw.githubusercontent.com/WARP-LAB/WARP-GUIDES-WEBPACK/master/LICENSE).