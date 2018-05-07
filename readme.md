# WEBPACK BEGINNERS GUIDE

## About

This is a quick, on demand and yet unedited/untested guide how to set up [webpack](https://webpack.js.org) build system (in the moment you drop [gulp](http://gulpjs.com) on when you haven't used any building/packing system before).

Originally this was written in times when webpack just came out and documentation, both official as well as users', was sparse and bad. Now there are many excellent *Hello World* as well as in in-depth tutorials on webpack. But I try to keep this up to date anyways.

Put together by @kroko for the new colleagues that see webpack for the first time. However I tried to formulate things in a way so that other random readers may also benefit.  
_While doing edits I realised that notes should be made for some basic npm stuff as the reality is - there are people who haven't used any building tools or even npm before (not-Node.js backend guys - PHP/ROR/... - leaning towards full stack of frontend), but want to jump in webpack. So this assumes entry level knowledge in Node/NPM._

## Chapters

### 1. webpack says *Hello World*

* OS requirements
* Project structure
* 4-tier system
* Basic config
* Loading JavaScript
* Minimising JavaScript
* Copying files from source to public without compiling
* Loading CSS and SCSS
* Scope hoisting
* Define plugin
* Notes on other loaders

### 2. Extra CSS, PostCSS settings and file loading

* PostCSS
* Bootstrapping CSS with *normalize.css*
* CSS source maps
* Making SCSS tier aware
* Image loading
* Image compressing
* Font loading (example for old bulletproof syntax)

### 3. webpack DevServer and hot reloading

* webpack DevServer setup
* CORS
* making it hot
* Introducing npm scripts and config example

### 4. HTML building, asset injecting and inlining, cache busting

* Building HTML
* Cache busting by using hases
* Inlining static assets in HTML using read from disk
* Minify HTML including inlined stuff

### 5. Babel

* Short explanation what Babel does
* Installing Babel
* Module system and Tree Shaking
* Babel env preset and polyfills
* browserslist and Babel
* Other polyfills and shims
* Babel plugins

### 6. Linting JavaScript and SCSS/CSS

* ESlint
* JavaScript Standard Style with ;
* stylelint

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

### X. React.js

* Out of date, will be revisited

### X. CSS modules

* Out of date, will be revisited

## Summary

* In the beginning examples will use JavaScript ES3/ES5 and SCSS.
* Then we will drop in loaders/plugins for SCSS ([PostCSS](http://postcss.org) + plugins).
* Then we will look how to set up basic hot-reloading DevServer.
* At this point you should be able to code oldschool sites using modern building system - ES3/ES5 JavaScript, use SCSS (I said _oldschool_, writing CSS directly is just _archaic_), hot reloading.
* Then we set up system so that we can code in at least ES6/ES2015 as well as check our code ([Babel](https://babeljs.io), [ESLint](http://eslint.org)).
* We add polyfills that we get out of the box from Babel.
* As a sidestep we look how to enable linter for text editors.
* Finally we add [React.js](https://facebook.github.io/react/) and [CSS Modules](https://github.com/css-modules/css-modules) in the mix, needed loaders and configuration.

### Assumptions

* As of writing webpack version is 4.7.0.
* I wrote this and tested locally on macOS and used `nginx` to serve `public` directory with wildcarding routes, under `test` TLD (`webpacktest-chaptername.test` in this case). See *Hello World* for setup.

### Your task

* clone it
* read it
* learn it
* create new project on your OS or in our server and test it step by step
* there are things that are left out, so ask if you don't see how to get from A to B
* watch out for errors (some stuff here is untested + things that simply do not work anymore, because there is better way to do it and/or webpack gets updates, you know...)
* add, commit and push fixes/changes/additions to this repo so that we can make this the ultimate beginners webpack + npm guide.

### Node.js / npm version

Make sure you have latest LTS, basically `node` version 8.x+, `npm` version 5.7.1+  
This tut has been tested on node 8.9.4 / npm 6.0.0.

### Todo / notes to self

* Extend more on `index.html` (or any other template, evern *PHP*) building via [*HtmlWebpackPlugin*](https://www.npmjs.com/package/html-webpack-plugin) - talk about plugins.
* TTFMP stuff
* PWA stuff
* Maybe discuss how *webpack-dev-server* can be launched via API