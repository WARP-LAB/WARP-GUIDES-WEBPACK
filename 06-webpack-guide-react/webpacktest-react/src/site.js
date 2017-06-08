// 'use strict';
//
// /* global __DEVELOPMENT__ */
//
// import './site.global.scss';
// import {helperA} from './helpers.js';
//
// import React from 'react';
// import ReactDOM from 'react-dom';
//
// if (__DEVELOPMENT__) {
//   window.React = React;
//   console.log('I\'m in development!');
// }
//
// helperA();
//
// ReactDOM.render(
//   <div><h1>{'Hello, React.js!'}</h1><p>{'Lorem ipsum'}</p></div>,
//   document.querySelector('.app')
// );
// --------- END EXAMPLE 1

// 'use strict';
//
// /* global __DEVELOPMENT__ */
//
// import './site.global.scss';
// import {helperA} from './helpers.js';
//
// import React from 'react';
// import ReactDOM from 'react-dom';
//
// import App from './Containers/App/App.js';
//
// if (__DEVELOPMENT__) {
//   window.React = React;
//   console.log('I\'m in development!');
// }
//
// helperA();
//
// ReactDOM.render(
//   <App />,
//   document.querySelector('.app')
// );
// --------- END EXAMPLE 2

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
