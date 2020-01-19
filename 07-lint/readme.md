# Linting JavaScript and CSS/SCSS

---
# In this section

* ESLint
* JavaScript Standard Style with ;
* Stylelint

---
# Preflight

Use existing code base from previous guide stage (`webpacktest-06-babel`). Either work on top of it or just make a copy.  
The directory now is called `webpacktest-07-lint`.  
Make changes in `package.json` name field.  
Don't forget `npm install`.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

```sh
cd webpacktest-07-lint
npm install
```

---
# ESLint

Apart from writing modern JavaScript one should follow some syntax as well as formatting rules. Oh well.

[ESLint](https://eslint.org)

[Specifying Parser](http://eslint.org/docs/user-guide/configuring#specifying-parser)  
[Ignoring Files and Directories](http://eslint.org/docs/user-guide/configuring#ignoring-files-and-directories)

## Install

Install [ESLint](https://github.com/eslint/eslint)

```sh
npm install eslint --save-dev
```

Install [babel-eslint](https://github.com/babel/babel-eslint)

> ESLint's default parser and core rules only support the latest final ECMAScript standard and do not support experimental (such as new features) and non-standard (such as Flow or TypeScript types) syntax provided by Babel. babel-eslint is a parser that allows ESLint to run on source code that is transformed by Babel.

```sh
npm install babel-eslint --save-dev
```

Install [eslint-plugin-babel](https://github.com/babel/eslint-plugin-babel), *an `eslint` plugin companion to `babel-eslint`*.

```sh
npm install eslint-plugin-babel --save-dev
```

## JavaScript Standard Style

This tutorial will use [**JavaScript Standard Style**](https://github.com/feross/standard#who-uses-javascript-standard-style), but with a catch - enforcing semicolons.  

There is [JavaScript Semi-Standard Style](https://www.npmjs.com/package/semistandard) already, which is *All the goodness of standard/standard with semicolons sprinkled on top.* This tutorial will create such standard from scratch - will take *JavaScript Standard Style*, enforce semicolons and add some *sprinkles on top*.

Not using AirBnB, Google.

However [Pure Standard](https://standardjs.com) will not be used to set up everything, but sharable config version of it - [ESLint Shareable Config for JavaScript Standard Style](https://github.com/feross/eslint-config-standard).

Documentation on what *sharable config* is can be found [here](https://eslint.org/docs/developer-guide/shareable-configs).

### Install

Install ESLint plugins that are needed for the current state of code complexity. Plugins listed below are demanded (peer dependencies) by [eslint-config-standard](https://github.com/standard/eslint-config-standard).

```sh
npm install eslint-plugin-node --save-dev
npm install eslint-plugin-import --save-dev
npm install eslint-plugin-promise --save-dev
npm install eslint-plugin-standard --save-dev
```
And installing the config itself

```sh
npm install eslint-config-standard --save-dev
```

## Configuration file

Creating new [configuration file](https://eslint.org/docs/user-guide/configuring) under master directory.

_.eslintrc.js_

```javascript
// keep json compatible key naming and comma trailing

/* eslint-disable quotes, quote-props */

module.exports = {
  "extends": [
    "eslint-config-standard"
  ],
  "plugins": [
    // "eslint-plugin-standard",
    // "eslint-plugin-promise",
    // "eslint-plugin-import",
    // "eslint-plugin-node",
    "eslint-plugin-babel"
  ],
  "parser": "babel-eslint",
  // https://eslint.org/docs/user-guide/configuring#specifying-parser-options
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "allowImportExportEverywhere": false,
    "codeFrame": true,
    // https://eslint.org/docs/1.0.0/user-guide/configuring#specifying-language-options
    "ecmaFeatures": {
      "globalReturn": true,
      "impliedStrict": true,
      "jsx": true,
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "browser": true,
    "node": true
  },
  "rules": {
    // "off" or 0 - turn the rule off
    // "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
    // "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)

    // Semicolons
    "semi": [2, "always"], // https://eslint.org/docs/rules/semi
    "no-extra-semi": 2, // https://eslint.org/docs/rules/no-extra-semi
    "semi-spacing": [2, {"before": false, "after": true}], // https://eslint.org/docs/rules/semi-spacing

    // Spacing
    // curly spacing, keep "consistent" with array-bracket-spacing
    "object-curly-spacing": [1, "never"], // https://eslint.org/docs/rules/object-curly-spacing
    "generator-star-spacing": [1, {"before": true, "after": false}], // https://eslint.org/docs/rules/generator-star-spacing

    // Others
    "brace-style": [1, "stroustrup"], // https://eslint.org/docs/rules/brace-style
    "object-shorthand": [1, "always"], // https://eslint.org/docs/rules/object-shorthand
    "arrow-parens": [1, "always"], // https://eslint.org/docs/rules/arrow-parens

    // Babel, https://github.com/babel/eslint-plugin-babel#rules
    "babel/new-cap": 1, // https://github.com/babel/eslint-plugin-babel#rules
    "babel/object-curly-spacing": 1, // https://github.com/babel/eslint-plugin-babel#rules

    // Ensure consistent use of file extension within the import path
    "import/extensions": [0, {"js": "always", "json": "always"}] // https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/extensions.md
  }
};

```

For base ESLint (ES2015/ES6)

* Parser option syntax is discussed in [ESLint Language Options](https://eslint.org/docs/user-guide/migrating-to-2.0.0#language-options).
* ESLint level rules are documented in [ESLint Rules](https://eslint.org/docs/rules/).
* ESLint Shareable Config for JavaScript Standard Style rules are [defined here](https://github.com/standard/standard/blob/master/RULES.md).
* Other plugin rules are defined in plugin docs.


Creating [eslintignore](https://eslint.org/docs/user-guide/configuring#eslintignore) configuration under master directory.

_.eslintignore_

```
# by default: node_modules/**
# by default: bower_components/**
public/**
static/**
!.postcssrc.js
!.eslintrc.js
!.stylelintrc.js
```

## webpack ESLint loader

Adding loader to webpack.

[elint-loader](https://github.com/webpack-contrib/eslint-loader)

```sh
npm install eslint-loader --save-dev
```

Updating *webpack.front.config.js*  

* When `!development` webpack build will not fail on warning, will fail on error, and will output all warnings an errors on terminal.  
*  When `development` webpack build will not fail on warning, will not fail on error (the error of course may be such that webpack is unable to compile), and will output all warnings an errors on terminal.
* This is a very verbose setup, `quiet` might be set to true to output only errors.

Enforcing the loader as *preloader*. Hence it lints JavaScript source as written by developer, before the source is touched (and changed) by other loaders, i.e, *babel-loader*.

_webpack.front.config.js_  

```javascript
// ...

// ----------------
// MODULE RULES
config.module = {
  rules: [
    {
      enforce: 'pre',
      test: /\.(js|mjs|ts)x?$/,
      exclude: [/node_modules/, /bower_components/, /preflight\.js$/],
      use: [
        {
          loader: 'eslint-loader',
          options: {
            emitError: true,
            emitWarning: true,
            failOnError: !development,
            failOnWarning: false,
            quiet: false,
            outputReport: false
          }
        }
      ]
    },

    // ...
    
```

In _src/index.js_ removing a semicolon.

```javascript
  const someObject = {x: 11, y: 12}
```

Run webpack DevServer

```sh
npm run front:dev:static
```

Error is outputted in terminal and built HTML in [http://localhost:4000/](http://localhost:4000/) also shows the error. After adding back the semicolon and saving file webpack DevServer auto reloads without error.

Build for testing

```sh
npm run front:build:test
```

If there is an error, build will be stopped and no build products will be found in `public/`.

## ESLint in source-code editors

This tutorial has held small tuts for Sublime, Atom, Visual Studio Code. Dropping that, refer to editors manual, which most probably will be

* install plugin for ESLint
* the plugin will use installed ESLint related `node_modules` in the project's directory or global ones
* the plugin will automatically pick up `.eslintrc.js` and `.eslintignore`
* plugin will apply the rules and visually report errors and warnings in the source

There are many plugins for the editor-of-choice that deal with adding ESLint support. Alternative is Prettier with ESLint integration prettier-eslint.

---
# Stylelint

Add linting to (S)CSS.

Stylelint is tricky, so Stylelint warning or errors are not normally allowed to abort building process. In real world scenario it is even disabled in webpack config and used only in editor as *guidance*.

Install [Stylelint](https://stylelint.io)

```sh
npm install stylelint --save-dev
```

Install [Webpack plugin for stylelint](https://github.com/webpack-contrib/stylelint-webpack-plugin)  

```sh
npm install stylelint-webpack-plugin --save-dev
```

Install Stylelint [configuration](https://github.com/stylelint/stylelint#extend-a-shared-configuration), choosing [stylelint-config-standard](https://github.com/stylelint/stylelint-config-standard) which apart for *possible error rules* turns on also ~60 [stylistic rules](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/rules.md#stylistic-issues).

```sh
npm install stylelint-config-standard --save-dev
```

Skipping [stylelint-config-recommended-scss](https://github.com/kristerkari/stylelint-config-recommended-scss), but installing Stylelint plugin for SCSS [https://github.com/kristerkari/stylelint-scss](stylelint-scss) *directly* (`stylelint-config-recommended-scss` uses `stylelint-scss`)

```sh
npm install stylelint-scss --save-dev
```

## Configuration file

Creating *.stylelintrc.js* and filling in some general values.

* [Stylelint Configuration](https://github.com/stylelint/stylelint/blob/master/docs/user-guide/configuration.md).
* [stylelint-scss plugin rules](https://github.com/kristerkari/stylelint-scss#list-of-rules)

_.stylelintrc.js_

```javascript
// keep json compatible key naming and comma trailing

/* eslint-disable quotes, quote-props */

module.exports = {
  "extends": [
    "stylelint-config-standard"
  ],
  "plugins": [
    "stylelint-scss"
  ],
  "rules": {

    "no-empty-source": null, // https://stylelint.io/user-guide/rules/no-empty-source

    "rule-empty-line-before": "always", // https://stylelint.io/user-guide/rules/rule-empty-line-before

    "block-closing-brace-empty-line-before": null, // https://stylelint.io/user-guide/rules/block-closing-brace-empty-line-before
    "max-empty-lines": [ // https://stylelint.io/user-guide/rules/max-empty-lines
      2,
      {
        "ignore": [
          "comments"
        ]
      }
    ],

    "at-rule-no-unknown": null, // disable and use scss/at-rule-no-unknown

    // --------------------------------------------
    // RULES FOR SCSS TO WORK (KIND OF)

    "block-opening-brace-space-before": "always", // https://stylelint.io/user-guide/rules/block-opening-brace-space-before
    "block-closing-brace-newline-after": [ // https://stylelint.io/user-guide/rules/block-closing-brace-newline-after
      "always",
      {
        "ignoreAtRules": [
          "if",
          "else"
        ]
      }
    ],

    "at-rule-empty-line-before": [ // https://stylelint.io/user-guide/rules/at-rule-empty-line-before
      "always",
      {
        "ignoreAtRules": [
          "else",
          "import"
        ]
      }
    ],
    "at-rule-name-space-after": "always", // https://stylelint.io/user-guide/rules/at-rule-name-space-after

    "scss/at-rule-no-unknown": true, // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-rule-no-unknown/README.md
    "scss/at-else-closing-brace-newline-after": "always-last-in-chain", // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-else-closing-brace-newline-after/README.md
    "scss/at-else-closing-brace-space-after": "always-intermediate", // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-else-closing-brace-space-after/README.md
    "scss/at-if-closing-brace-newline-after": "always-last-in-chain", // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-if-closing-brace-newline-after/README.md
    "scss/at-if-closing-brace-space-after": "always-intermediate" // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-if-closing-brace-space-after/README.md
  }
};

```

Adding `.stylelintignore` to ignore compiled CSS.

_.stylelintignore_

```
public/**
static/**
```

Adding plugin to *webpack.config.js* and setting [options](https://stylelint.io/user-guide/node-api#options).

_webpack.config.js_

```javascript
// ...

const StylelintPlugin = require('stylelint-webpack-plugin'); // eslint-disable-line no-unused-vars

// ...

// ----------------
// StyleLint
config.plugins.push(new StylelintPlugin({
  configFile: path.resolve(__dirname, '.stylelintrc.js'),
  files: ['**/*.s?(a|c)ss'],
  fix: false,
  lintDirtyModulesOnly: false,
  emitError: false,
  emitWarning: false,
  failOnError: false,
  failOnWarning: false,
  quiet: false
}));

// ...
```

With this config build will not stop on S(C)SS errors.

Adding some questionable code to SCSS.

_src/index.scss_

```scss
// ...

yolo {
  colooor: bluez
}

// ...
```

Run webpack DevServer

```sh
npm run front:dev:static
```

Console outputs

```
ERROR in
src/index.scss
 39:1   ✖  Unexpected unknown type selector "yolo"   selector-type-no-unknown
 40:3   ✖  Unexpected unknown property "colooor"     property-no-unknown
 40:16  ✖  Expected a trailing semicolon             declaration-block-trailing-semicolon
```

In order to terminal still show (S)CSS issues, but only (no overlay in rendered HTML), *StylelintPlugin* can be set to emit everything as warnings.

_webpack.config.js_

```javascript
// ...

// ----------------
// StyleLint
config.plugins.push(new StylelintPlugin({
  configFile: path.resolve(__dirname, '.stylelintrc.js'),
  files: ['**/*.s?(a|c)ss'],
  fix: false,
  lintDirtyModulesOnly: false,
  emitError: false,
  emitWarning: true,
  failOnError: false,
  failOnWarning: false,
  quiet: false
}));

// ...
```

Run webpack DevServer

```sh
npm run front:dev:static
```

Terminal notes the issue, but one can keep on developing.

Building the project for testing.

```sh
npm run front:built:test
```

Console outputs notes about error (or warning, based on `emitWarning` flag), but continues to build.

Normally *StylelintPlugin* can be disabled in webpack config and run just time to time. One can use Stylelint within source-code editor as a hinting tool.

## Stylelint in in source-code editors

Same principles as for ESLint applies (noted above). Alternative is Prettier with Stylelint integration prettier-stylelint.

---
# Result

See `webpacktest-07-lint` directory.  
Images and fonts have to be copied to `src/..` from `media/..`, otherwise build fill fail.

---
# Next

Bundle analysing and chunk splitting.
