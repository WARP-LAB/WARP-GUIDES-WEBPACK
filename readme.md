# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

### About

This is a quick, on demand and yet unedited/untested guide how to set up [webpack](https://webpack.github.io) build system (in the moment you drop [gulp](http://gulpjs.com) on when you haven't used any building/packing system before).

Put together by @kroko for the new colleagues that see webpack for the first time. However I tried to formulate things in a way so that other random readers may also benefit.  
_While doing edits I realised that notes should be made for some basic npm stuff as the reality is - there are people who haven't used any building tools or even npm before (not-Node.js backend guys - PHP/ROR/... - leaning towards full stack of frontend), but want to jump in webpack. So this assumes entry level knowledge in Node/NPM._

### Steps

* In the beginning examples will use JavaScript ES3/ES5 and SCSS.
* Then we will drop in loaders/plugins for SCSS ([PostCSS](http://postcss.org) + plugins).
* Then we will look how to set up basic hot-reloading dev server.
* At this point you should be able to code oldschool sites using modern building system - ES3/ES5 JavaScript, use SCSS (I said _oldschool_, writing CSS directly is just _archaic_), hot reloading.
* Then we set up system so that we can code in ES6 as well as check our code ([Babel](https://babeljs.io), [ESLint](http://eslint.org)).
* We add polyfills that we get out of the box from Babel.
* As a sidestep we look how to enable linter for text editors.
* Finally we add [React.js](https://facebook.github.io/react/) and [CSS Modules](https://github.com/css-modules/css-modules) in the mix, needed loaders and configuration.

### Assumptions

* as of writing this webpack version is 2.6.1.
* Examples are for frontend only.
* I wrote this and tested locally on macOS and used `nginx` to serve `public` directory with wildcarding routes, under `dev` TLD (`webpacktest.dev` in this case).
* Guide assumes either local development (macOS) or our devserver pool for which a virtual host is configured that the `public` directory that you will see later is the `DocumentRoot` of that vhost. Just create new devsite via `warpdevsite nameformywebpacktest && cdd nameformywebpacktest ` and you're all set. If you want to try this outside our devserver with small modifications it will also work if serving stuff via NGINX (hot relaod proxy in `.htaccess` that I'm going to talk about then should go in conf) as well as Node.js (simple `http` + `node-static` or full Koa/Express).

### Your task

* clone it
* read it
* learn it
* create new project on your OS or in our server and test it step by step
* there are things that are left out, so ask if you don't see how to get from A to B
* watch out for errors (some stuff here is untested + things that simply do not work anymore, because there is better way to do it and/or webpack gets updates, you know...)
* add, commit and push fixes/changes/additions to this repo so that we can make this the ultimate beginners webpack + npm guide.


### Node.js / npm version

Make sure you have `npm` version 3.x.

### Todo

* code splitting in app and vendor [using entries](https://webpack.js.org/concepts/entry-points/#separate-app-and-vendor-entries) and *CommonsChunkPlugin* or [DllPlugin](https://webpack.js.org/plugins/dll-plugin/)
* Extend on `index.html` building via [*HtmlWebpackPlugin*](https://www.npmjs.com/package/html-webpack-plugin) - talk about plugins.
* [manifest.appcache](https://github.com/lettertwo/appcache-webpack-plugin) (HTML5 app cache) to make our app work offline (related to *HtmlWebpackPlugin*)
* We have discussed how *webpack-dev-server* can be launched via CLI in Webpack 1.x guide (and this still applies to Webpack 2). In this guide we have used `devServer` key in webpack config to configure the server. Discuss how *webpack-dev-server* can be launched via API (that is some separate file to launch server - `server.dev.js` containing `new WebpackDevServer()`).
* [async preloading](https://github.com/GoogleChrome/preload-webpack-plugin) via *PreloadWebpackPlugin*
* Extend on *UglifyJS* (and/or *Babili* alternative) and ECMAScript versions. In this guide we use webpack built in `webpack.optimize.UglifyJsPlugin` that can only work on ES5 which here is not an issue - our original ES2015(ES6), ES2016, ES2017, some stage-x features code is passed through Babel, which results in *UglifyJS* receiving ES5. However, minification stage at when code is still ES2015(+) is beneficiary, especially if we were to write stuff for node targets. Current node 99% implements both ES215 as well as ES2016 [reference](http://node.green).