# WEBPACK 2 BEGINNERS GUIDE <sup>+ npm side notes</sup>

---
# Preflight
---

Use existing `webpacktest-lint` code base from previous guide stage. Either work on top of it or just make a copy. The directory now is called `webpacktest-react`.

Make changes in `package.json` and `index.html` to reflect host change to `webpacktest-react.dev`.

---
# WEBPACK 2 REACT GUIDE
---

### About

This is needed addition fort the vanilla guide (see it first) to get React going.

## React.js

Install

```sh
npm install react --save-dev
npm install react-dom --save-dev
```

Install prop types

```sh
npm install prop-types --save-dev
```

Install Babel presets for React.js & JSX

```sh
npm install babel-preset-react --save-dev
npm install babel-preset-react-optimize --save-dev
```

`react-optimize` preset is collection of plugins, discussed [here](https://medium.com/doctolib-engineering/improve-react-performance-with-babel-16f1becfaa25#.g6ok9xvs2).

We have already `babel-preset-env` installed.

Reconfigure *.babelrc* to include react preset

```json
{
  "presets": [
  	[
      "env",
    	{
        "targets": {
          "browsers": [
          	"> 1%",
          	"last 2 versions",
          	"Firefox ESR",
            "IE 11",
            "iOS > 7"
          ]
        },
        "useBuiltIns": true,
        "modules": false,
        "debug": false
      }
    ],
    "react"
  ],
  "plugins": [
  ],
  "env": {
    "development": {
    },
    "testing": {
      "presets": ["react-optimize"]
    },
    "staging": {
      "presets": ["react-optimize"]
    },
    "production": {
      "presets": ["react-optimize"]
    }
  }
}
```

Install ESLint plugin for React.js

```sh
npm install eslint-plugin-react --save-dev
```

[Read docs](http://eslint.org/docs/user-guide/configuring)

Reconfigure *.eslintrc.js* to include react, jsx and rules.

```javascript
// keep json compatible key naming and comma trailing!

/* eslint-disable quotes */

module.exports = {
  "plugins": [
    "standard",
    "promise",
    "import",
    "babel",
    "react"
  ],
  "parser": "babel-eslint",
  "parserOptions": {
    "ecmaVersion": 6,
    "sourceType": "module",
    "ecmaFeatures": {
      "impliedStrict": true,
      "globalReturn": true,
      "experimentalObjectRestSpread": true,
      "jsx": true
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

    "import/extensions": [0, {"js": "always", "json": "always"}],

    "jsx-quotes": [2, "prefer-double"],

    "react/jsx-boolean-value": [1, "never"],
    "react/jsx-closing-bracket-location": [1, {"location": "tag-aligned"}],
    "react/jsx-curly-spacing": [2, "never"],
    "react/jsx-indent-props": [1, 2],
    "react/jsx-max-props-per-line": [1, {"maximum": 2}],
    "react/jsx-no-duplicate-props": [2, {"ignoreCase": false}],
    "react/jsx-no-literals": 1,
    "react/jsx-no-undef": 2,
    "react/jsx-wrap-multilines": 2,
    "react/jsx-uses-react": 1,
    "react/jsx-uses-vars": 2,

    "react/display-name": [2, {"ignoreTranspilerName": false}],
    "react/no-danger": 1,
    "react/no-multi-comp": 1,
    "react/no-unknown-property": 2,
    "react/prop-types": 2,
    "react/react-in-jsx-scope": 1,
    "react/require-extension": "off",
    "react/self-closing-comp": 2,
    "react/sort-comp": 1,

    "react/no-set-state": 0,

    "react/no-did-mount-set-state": 1,
    "react/no-did-update-set-state": 1
  }
};

```

_src/site.js_

```javascript
'use strict';

/* global __DEVELOPMENT__ */

import './site.global.scss';
import {helperA} from './helpers.js';

import React from 'react';
import ReactDOM from 'react-dom';

if (__DEVELOPMENT__) {
  window.React = React;
  console.log('I\'m in development!');
}

helperA();

ReactDOM.render(
  <div><h1>{'Hello, React.js!'}</h1><p>{'Lorem ipsum'}</p></div>,
  document.querySelector('.app')
);
```

Build it.

## Create webpack dummy App

Containers_src/Containers/App/App.js_ 

```javascript
'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';

class App extends Component {
  static propTypes = {
    myProp: PropTypes.any
  };
  static defaultProps = {
    myProp: null
  };

  constructor (props) {
    console.log('App constructor', props);
    super(props);

    this.state = {
      aVal: 1,
      bVal: 2,
      cVal: 3
    };

    this.onClickHandler = ::this.onClickHandler;
  }

  onClickHandler () {
    this.setState({
      aVal: this.state.aVal + 1
    });
  }

  render () {
    console.log('App render', this.props);
    const {aVal} = this.state;
    return (
      <div
        onClick={this.onClickHandler}
        className="template-component"
      >
        {`I am App and this is my value: ${aVal}`}
      </div>
    );
  }
}

export default App;
```

_src/site.js_

```javascript
'use strict';

/* global __DEVELOPMENT__ */

import './site.global.scss';
import {helperA} from './helpers.js';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './Containers/App/App.js';

if (__DEVELOPMENT__) {
  window.React = React;
  console.log('I\'m in development!');
}

helperA();

ReactDOM.render(
  <App />,
  document.querySelector('.app')
);
```

**At this point we start needing those `stage-x` features via Babel plugins (mentioned in Babel stage of this guide).**

Install and add to _.babelrc_ plugins section.

```sh
npm install babel-plugin-transform-class-properties --save-dev
npm install babel-plugin-transform-function-bind --save-dev
npm install babel-plugin-transform-object-rest-spread --save-dev
```

Build it.  
Click on text to see counter go up.
Change something in *App.js* and watch as app reloads. However, counter state is lost... enter hot reloading for React.

## Webpack hot loader for React

First read about [Webpack built hot reloading](https://webpack.js.org/guides/hot-module-replacement/)

We will look at hot reloading React.js components without loosing state.

As of writing hot reloader is 3.0.0-beta.7

```sh
npm install react-hot-loader@next --save-dev
```

This can be put either in `.babelrc` env or webpack config, [see docs](https://github.com/gaearon/react-hot-loader/tree/master/docs#migration-to-30). More semantic seems config, as it is about loader, not babeling, however let us use suggested.

In *.babelrc* add hot loader to development.  

Remember that

* *The env key will be taken from `process.env.BABEL_ENV`, when this is not available then it uses `process.env.NODE_ENV` if even that is not available then it defaults to "development".* 
* we do use `process.env.NODE_ENV`.

```json
{
  "env": {
    "development": {
      "plugins": [
        "react-hot-loader/babel"
      ]
    }
  }
}

```

Edit entry point in _webpack.config.js_  
Also move polyfill before hot loader and you may set source map to `eval` for faster build times.

```javascript
// ...

const sourceMapType = (development) ? 'eval' : false;

// ...

    site: [
      'babel-polyfill',
      'classlist-polyfill',
      'react-hot-loader/patch',
      path.join(__dirname, 'src/site.js')
    ],
    
// ...
```

*site.js*

```javascript
'use strict';

/* global __DEVELOPMENT__ */

import './site.global.scss';
import {helperA} from './helpers.js';

import React from 'react';
import ReactDOM from 'react-dom';

import {AppContainer} from 'react-hot-loader';

import App from './Containers/App/App.js';

if (__DEVELOPMENT__) {
  window.React = React;
  console.log('I\'m in development!');
}

helperA();

const renderWithHotContainer = (AppComponentToRender) => {
  ReactDOM.render(
    <AppContainer>
      <AppComponentToRender />
    </AppContainer>,
    document.querySelector('.app')
  );
};

renderWithHotContainer(App);

if (module.hot) {
  module.hot.accept('./Containers/App/App.js', () => {
    renderWithHotContainer(App);
    // We do not need to rerequire https://github.com/gaearon/react-hot-loader/tree/master/docs#webpack-2
    // const NextApp = require('./Containers/App/App.js').default;
    // renderWithHotContainer(NextApp);
  });
}
```

Build it.
Click on text to see counter go up.
Change something in *App.js* render output and watch as app changes. However, counter is not reset (state is kept).

## Extension and loaders

This might be the point where for React code you could start using `.jsx` extension which hints both you as well as your editor about file contents. In this case remember to add rules to webpack config to parse those files as you want (`test: /\.jsx$/`).

## Move on

This isn't about webpack any more.

Install Redux

```sh
npm install redux --save-dev
```

Install React bindings

```sh
npm install react-redux --save-dev
npm install redux-devtools --save-dev
```

Install React router 4 which has finally left beta.
Think if you even need `react-router-redux`. If so then use `next`, existing stable version as of now is not compatible with router v4.
We do not install full router here (has both DOM and native), but only `react-router-dom` as we are doing only frontend here.

```sh
npm install react-router-dom --save-dev
```

Older router versions needed `history` to be `<3.0.0`, beta router includes `history@4.6.0`

Do not use `transform-decorators-legacy` any more, but keep in mind that we used this stage-0 feature in older projects.







