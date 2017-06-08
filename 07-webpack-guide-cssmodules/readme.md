# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# Preflight
---

Use existing `webpacktest-react` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-cssmodules`.

Make changes in `package.json`.  
Make changes in `index.html` (`index-manual-approach.html`) to reflect host change to `webpacktest-cssmodules.dev` if you are not using HTML building as discussed in *htmlbuild* stage of this guide.

Note that CSS modules is not React only thing, use it wherever, but we will use it React context.

---
# CSS Modules
---

## Setup loaders


Container and component split CSS.

* Add rule for SCSS that does not use CSS Modules if file is something for global scope.
* Add rule for SCSS that uses CSS modules if filename does not include global.
* Keep rule for pure CSS.

This filename based rule loading is *helper* and does the job most of the time, however sometimes things still need to be enclosed into tags to work as needed.

```scss
:global {

  @import "~i-want-this-to-be-global.scss"; // filename does not match "*.global.scss"
  
  html.unsupported .app {
    display: none !important;
  }
}
```

*webpack.config.js*


```javascript

// ...

    // all CSS files considered to be in global namespace (i.e., normalize.css)
    // you can still scope them by importing them within :local{} block
    {
      test: /\.(css)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          }
        ]
      })
    },
    // all content for SCSS files that filenames contain *.global.scss are considered to in global namespace
    {
      test: /.\.global\.(scss)$/,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 3,
              sourceMap: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
    // all content for SCSS files that filenames do not contain *.global.scss, will receive CSS modules namespace treatment
    // you can still use :global{} within them
    {
      test: /^((?!\.global).)*\.(scss)$/i,
      use: ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: [
          {
            loader: 'css-loader',
            options: {
              importLoaders: 3,
              sourceMap: true,
              modules: true,
              localIdentName: (development) ? '[name]__[local]___[hash:base64:5]' : '[hash:base64:16]',
              camelCase: true
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              sourceMap: true
            }
          },
          {
            loader: 'resolve-url-loader',
            options: {
              keepQuery: true
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              data: `$env: ${JSON.stringify(process.env.NODE_ENV || 'development')};`
            }
          }
        ]
      })
    },
        
// ...
```

## Test code


Create *Containers/App/AApp.scss*

```scss
@mixin testmixin {
  color: yellow;
}

.myBase {
  background-color: green;
}

.templateComponent {
  composes: myBase;

  @include testmixin;

  font-style: italic;
}

:global {

  .app {
    background-color: brown;
    background-image: none;
  }
}

```

Import it in *Containers/App/App.js*

```javascript
// ...

import styles from './App.scss';

// ...

      <div
        onClick={this.onClickHandler}
        className={styles.templateComponent}
      >
        {`I am App and this is my value: ${aVal}`}
      </div>
      
// ...

```

Build it, observe.

`.app` behaviour specified in `site.global.scss` is still there (as well as (S)CSS that is imported in it), because of the `*.global.scss` naming.  
However `App.scss` has CSS modules magic applied to it. Meanwhile within App.scss via *:global* enclosure we could still change global class name behaviour.  
This will get you started.


## Stylelinting

This is tricky, remember notes about stylelit caveats in *lint* phase of this guide.

Configure *.stylelintrc.js*

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
    // STYLELINT RULES FOR SCSS

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
    "scss/at-if-closing-brace-space-after": "always-intermediate",

    // --------------------------------------------
    // STYLELINT RULES FOR CSS MODULES

    "selector-pseudo-class-no-unknown": [
      true,
      {
        "ignorePseudoClasses": [
          "export",
          "import",
          "global",
          "local"
        ]
      }
    ],
    "property-no-unknown": [
      true,
      {
        ignoreProperties:
        [
          "composes"
        ]
      }
    ]
    // this messes up ignoreAtRules for SCSS, thus ignore
    // "at-rule-no-unknown": [
    //   true,
    //   {
    //     "ignoreAtRules": [
    //       "value"
    //     ]
    //   }
    // ]
  }
};

```
