# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# Preflight
---

Use existing `webpacktest-babel` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-lint`.

Make changes in `package.json`.  
Make changes in `index.html` (`index-manual-approach.html`) to reflect host change to `webpacktest-lint.dev` if you are not using HTML building as discussed in *htmlbuild* stage of this guide.

---
# ESLint
---

Apart from writing modern JavaScript you will have to obey syntax rules as well as formatting rules. Oh well.

## ESLint


<http://eslint.org/docs/user-guide/configuring#specifying-parser>  
<http://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories>

Install ESLint

```sh
npm install eslint --save-dev
```

Install plugin for Babel

```sh
npm install babel-eslint --save-dev
npm install eslint-plugin-babel --save-dev
```

Install ESLint plugins

```sh
npm install eslint-plugin-node --save-dev
npm install eslint-plugin-promise --save-dev
npm install eslint-plugin-import --save-dev
npm install eslint-plugin-standard --save-dev
```

Install config we will be using as base

```sh
npm install eslint-config-standard --save-dev
```

Crete new file _.eslintrc.js_ under master directory and fill it

```javascript
// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "plugins": [
    "standard",
    "promise",
    "import",
    "babel"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "impliedStrict": true,
      "globalReturn": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "browser": true,
    "node": true
  },
  "extends": [
    "standard"
  ],
  "rules": {
    "semi": [2, "always"],
    "no-extra-semi": 2,
    "semi-spacing": [2, {"before": false, "after": true}],
    "generator-star-spacing": 1,
    "object-shorthand": 1,
    "arrow-parens": 1,

    "babel/new-cap": 1,
    "babel/object-curly-spacing": 1,

    "import/extensions": [0, {"js": "always", "json": "always"}]
  }
};

```

Crete new file _.eslintignore_ under master directory and fill it

```
# by default: node_modules/*
# by default: bower_components/*
!.eslintrc.js
!.stylelintrc.js
static/*
```

## Webpack ESLint loader

Wee add new loader to our webpack. It is _preloader_, thus it pre-lints our JavaScript files.

```sh
npm install eslint-loader --save-dev
```

Update _webpack.front.config.js_  
webpack 2 does not have `pre/postLoaders`, we have to use `enforce`.  
And add ESLint configuration. It will fail on any errors or warning when `!development`, it will build, but scream when `development`.

```javascript
// ...
    {
      enforce: 'pre',
      test: /\.js$/,
      exclude: [/node_modules/, /preflight\.js$/],
      loader: 'eslint-loader',
      options: {
        emitError: true,
        emitWarning: true,
        quiet: false,
        failOnWarning: !development,
        failOnError: !development,
        outputReport: false
      }
    },

// ...
```

In _src/site.js_ do something questionable

```javascript
'use strict';

/* global __DEVELOPMENT__ */

import './site.global.scss';
import {helperA} from './helpers.js';

if (__DEVELOPMENT__) {
  console.log('I\'m in development!');
}

const greetings = {
  yesterday: 'Hello World!',
  today: 'Hello new JS with linting!'
};

const myArrowFunction = () => {
  const div = document.querySelector('.app') // <-- LIKE NOT ADDING SEMICOLON
  const {today} = greetings;
  div.innerHTML = `<h1>${today}</h1><p>Lorem ipsum.</p>`;
  div.classList.add('some-class');
  console.log('Hello JS!');
  helperA();
};

myArrowFunction();
```

Build it.

Observe webpack building notices/warnings/errors. It should contain something like this

```sh
ERROR in ./src/site.js
Module build failed: Error: Module failed because of a eslint error.
  18:45  error  Missing semicolon  semi
```

Add back semicolon, rebuild, observe. 

## ESLint in text editors

### Atom

```sh
apm install linter
apm install linter-ui-default
apm install linter-eslint
```

It will use the same `.eslintrc.js`

### Sublime Text 3 - ESLint

We use Atom. webpack-1.x guide has Sublime setup covered.

## Set ESLint autofix in text editors

**Don't trust autofix, use with care, per one file only! This is like autorouting in EDA.. sad panda.**

### Atom

Todo.

### Sublime

We use Atom. webpack-1.x guide has Sublime setup covered.

---
# stylelint
---

Add linting also to your SCSS.

## Webpack stylelint

Stylelint is tricky, so stylelint errors are not allowed to abort building process. More often than not it is even disabled in webpack config. But use it in editor as guidance.

[stylelint-webpack-plugin](https://github.com/JaKXz/stylelint-webpack-plugin)  
_This webpack plugin will also install `stylelint` dependency, therefore we do not install raw `stylelint`. Might not be the latest, but whatever._

```sh
npm install stylelint-webpack-plugin --save-dev
```

Install Stylelint plugins and configs

```sh
npm install stylelint-scss --save-dev
npm install stylelint-config-standard --save-dev
```


Create _.stylelintrc.js_ and fill in some general values. See
* [stylelint configuration](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md).
* [stylelint-scss plugin rules](https://github.com/kristerkari/stylelint-scss#list-of-rules)

```javascript
// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "extends": [
    "stylelint-config-standard"
  ],
  "plugins": [
    "stylelint-scss"
  ],
  "rules": {

    // --------------------------------------------
    // RULES FOR SCSS

    "at-rule-empty-line-before": [
      "always",
      {
        "ignoreAtRules": [ "else", "import" ]
      }
    ],
    "block-opening-brace-space-before": "always",
    "block-closing-brace-newline-after": [
      "always",
      {
        "ignoreAtRules": [ "if", "else" ]
      }
    ],
    "at-rule-name-space-after": "always",
    "rule-empty-line-before": "always",
    "scss/at-else-closing-brace-newline-after": "always-last-in-chain",
    "scss/at-else-closing-brace-space-after": "always-intermediate",
    "scss/at-if-closing-brace-newline-after": "always-last-in-chain",
    "scss/at-if-closing-brace-space-after": "always-intermediate"
  }
};

```

Add plugin to _webpack.config.js_

```javascript
// ...

const StyleLintPlugin = require('stylelint-webpack-plugin');

// ...

// ----------------
// StyleLint CONFIG

config.plugins.push(new StyleLintPlugin({
  configFile: '.stylelintrc.js',
  emitErrors: true,
  failOnError: false,
  files: ['**/*.s?(a|c)ss'],
  lintDirtyModulesOnly: false,
  syntax: 'scss',
  quiet: false
}));

// ...
```


In _src/site.global.scss_ do something questionable, like incorrect (S)CSS

```scss
@charset 'UTF-8';
@import '~normalize.css';
@import 'site.legacy.css';
@import 'typography.scss';

$mycolor: red;

$paragarphColor: black;

@if $env == 'development' {
  $paragarphColor: magenta;
} @else {
  $paragarphColor: yellow;
}

body {
  background-image: url('./images/my-large-image.jpg');
}

.app {
  background-color: $mycolor;
  display: flex;
  transform: translateY(50px);
  height: 200px;

  p {
    color: $paragarphColor;
  }

  background-image: url('./images/my-small-image.jpg');
}

.dummy-class {
  colooor: bluez
}
```

Build the project, observe how build fails. Fix them.

Make build not fail on S(C)SS errors by setting

```javascript
    emitErrors: false,
```

which will make them as warnings and build will continue.

## stylelint in text editors

### Atom

```sh
apm install linter-stylelint
```

It will use the same `.stylelintrc.js`

### Sublime Text 3 - ESLint

We use Atom. webpack-1.x guide has Sublime setup covered.


## Config for plain JavaScript

At this point we have base for vanilla JS projects configured. Start coding!

Yet another step is adding React.