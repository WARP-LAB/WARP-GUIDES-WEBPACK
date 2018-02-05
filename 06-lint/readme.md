# Linting JavaScript and CSS/SCSS


---
# In this section
---

* ESlint
* stylelint

---
# Preflight
---

Use existing `webpacktest-babel` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-lint`. Make changes in `package.json` name field. Don't forget `npm install`.

---
# ESLint
---

Apart from writing modern JavaScript you will have to obey syntax rules as well as formatting rules. Oh well.

## ESLint


<http://eslint.org/docs/user-guide/configuring#specifying-parser>  
<http://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories>

When installing stuff below check [inter-compatability](https://github.com/babel/babel-eslint#supported-eslint-versions)

Install ESLint

```sh
npm install eslint --save-dev
```

Install plugin for Babel

```sh
npm install babel-eslint --save-dev
```

As well as *`eslint` plugin companion to `babel-eslint`*

```sh
npm install eslint-plugin-babel --save-dev
```

## JavaScript Standard Style

We will be coding and linting our code against [**JavaScript Standard Style**](https://github.com/feross/standard#who-uses-javascript-standard-style) (yes, not using AirBNB)

However we will not be using [*pure standard*](https://standardjs.com), but sharable config version of it - [ESLint Shareable Config for JavaScript Standard Style](https://github.com/feross/eslint-config-standard)

**We will be using semicolons [whatever they say](https://www.youtube.com/watch?v=gsfbh17Ax9I), end of story.**

Install ESLint plugins that are needed for our current state of code complexity. Basically plugins listed below are demanded (peer dependencies) by [eslint-config-standard](https://github.com/standard/eslint-config-standard#usage) that we will be using, see below.

```sh
npm install eslint-plugin-import --save-dev
npm install eslint-plugin-node --save-dev
npm install eslint-plugin-promise --save-dev
npm install eslint-plugin-standard --save-dev
```
And install the config itself

```sh
npm install eslint-config-standard --save-dev
```

## Configuration file

Crete new file _.eslintrc.js_ under master directory and fill it

```javascript
// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "plugins": [
    // "standard",
    // "promise",
    // "import",
    "babel"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "sourceType": "module",
    "allowImportExportEverywhere": false,
    "codeFrame": true,
    "ecmaVersion": 6,
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
    "eslint-config-standard"
  ],
  "rules": {
    // "off" or 0 - turn the rule off
    // "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
    // "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)

    "semi": [2, "always"], // https://eslint.org/docs/rules/semi
    "no-extra-semi": 2, // https://eslint.org/docs/rules/no-extra-semi
    "semi-spacing": [2, {"before": false, "after": true}], // https://eslint.org/docs/rules/semi-spacing
    "generator-star-spacing": 1, // https://eslint.org/docs/rules/generator-star-spacing
    "object-shorthand": 1, // https://eslint.org/docs/rules/object-shorthand
    "arrow-parens": 1, // https://eslint.org/docs/rules/arrow-parens

    "babel/new-cap": 1, // https://github.com/babel/eslint-plugin-babel#rules
    "babel/object-curly-spacing": 1, // https://github.com/babel/eslint-plugin-babel#rules

    "import/extensions": [0, {"js": "always", "json": "always"}] // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
  }
};


```
For base ESLINT (ES2015 - ES6)

* Parser option syntax is discussed in [ESlint Language Options](https://eslint.org/docs/user-guide/migrating-to-2.0.0#language-options).
* ESlint level rules are documented in [ESlint Rules](https://eslint.org/docs/rules/).
* ESLint Shareable Config for JavaScript Standard Style rules are [defined here](https://github.com/standard/standard/blob/master/docs/RULES-en.md).
* Other plugin rules are defined in plugin docs.


Crete new file _.eslintignore_ under master directory and fill it so that we do not lint build products but we do lint hidden configuration files.

```
# by default: node_modules/**
# by default: bower_components/**
public/**
static/**
!.postcssrc.js
!.eslintrc.js
!.stylelintrc.js
```

## Webpack ESLint loader

Add new loader to our webpack - it is _preloader_, thus it pre-lints our JavaScript files.

```sh
npm install eslint-loader --save-dev
```

Update _webpack.front.config.js_  
webpack does not have `pre/postLoaders` any more, we have to use `enforce`.  
And add ESLint configuration. It will fail on any error or warning when `!development`, it will build, but scream when `development` (note that this is very restrictive setup, in real world it can bee loosened).

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
        failOnWarning: !development,
        failOnError: !development,
        quiet: true,
        outputReport: false
      }
    },

// ...
```

In _src/index.js_ do something questionable LIKE REMOVING SEMICOLON :)

Build it for development.

Observe webpack building notices/warnings/errors. Console should contain something like this

```sh
ERROR in ./src/index.js
Module build failed: Module failed because of a eslint error.

  error  Missing semicolon  semi

✖ 1 problem (1 error, 0 warnings)
  1 error, 0 warnings potentially fixable with the `--fix` option.
```

as well as webapp in browser should contain such overlay.

Add back semicolon, save file, *DevServer* will auto rebuild it and error is gone. 

## ESLint in text editors

### Atom

Just ask sharable Atom package settings, but basically it consists of

```sh
apm install linter
apm install linter-ui-default
apm install linter-eslint
```

It will use the same `.eslintrc.js`

---
# stylelint
---

Add linting also to your (S)CSS.

## Webpack stylelint

Stylelint is tricky, so stylelint errors are not allowed to abort building process. More often than not it is even disabled in webpack config and used only in editor as guidance.

Install [Stylelint](https://stylelint.io)

```sh
npm install stylelint --save-dev
```

Install [Webpack plugin for stylelint](https://github.com/JaKXz/stylelint-webpack-plugin)  

```sh
npm install stylelint-webpack-plugin --save-dev
```

Install Stylelint plugins and configs

```sh
npm install stylelint-scss --save-dev
npm install stylelint-config-standard --save-dev
```

## Configuration file

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

    "rule-empty-line-before": "always",

    "block-closing-brace-empty-line-before": null,
    "max-empty-lines": [
      2,
      {
        "ignore": [
          "comments"
        ]
      }
    ],

    // --------------------------------------------
    // RULES FOR SCSS TO WORK (KIND OF)

    "block-opening-brace-space-before": "always",
    "block-closing-brace-newline-after": [
      "always",
      {
        "ignoreAtRules": [
          "if",
          "else"
        ]
      }
    ],

    "at-rule-empty-line-before": [
      "always",
      {
        "ignoreAtRules": [
          "else",
          "import"
        ]
      }
    ],
    "at-rule-name-space-after": "always",

    "at-rule-no-unknown": [
      true,
      {
        "ignoreAtRules": [
          "charset",
          "import",
          "extend",
          "at-root",
          "debug",
          "warn",
          "error",
          "if",
          "else",
          "for",
          "each",
          "while",
          "mixin",
          "include",
          "content",
          "return",
          "function"
        ]
      }
    ],

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

const StyleLintPlugin = require('stylelint-webpack-plugin'); // eslint-disable-line no-unused-vars

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


In _src/index.global.scss_ do something questionable, like incorrect (S)CSS

```scss
yolo {
  colooor: bluez
}
```

Build the project for development, observe how build fails with

```
WARNING in
src/index.global.scss
 33:1   ✖  Unexpected unknown type selector "yolo"   selector-type-no-unknown
 34:3   ✖  Unexpected unknown property "colooor"     property-no-unknown
 34:16  ✖  Expected a trailing semicolon             declaration-block-trailing-semicolon
```

Make build not fail on S(C)SS errors by setting

```javascript
// ...
config.plugins.push(new StyleLintPlugin({
// ...
    emitErrors: false,
// ...
}));
```

which will make them as warnings, but build will continue.

Add also `.stylelintignore` to ignore compiled CSS

```
public/**
static/**
```

Note that currently Atom ignores `.stylelintignore`, meh.

## stylelint in text editors

### Atom

```sh
apm install linter-stylelint
```

It will use the same `.stylelintrc.js`

---
# Next
---

Bundle analyzing and chunk splitting.
