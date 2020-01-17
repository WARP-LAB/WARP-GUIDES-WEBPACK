// keep json compatible key naming and comma trailing

/* eslint-disable quotes, quote-props */

module.exports = {
  "presets": [
    [
      "@babel/preset-env",
      {
        "modules": false,
        "useBuiltIns": "usage",
        "corejs": 3,
        "forceAllTransforms": false,
        "ignoreBrowserslistConfig": false,
        "debug": true
      }
    ]
  ],
  "plugins": [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-syntax-dynamic-import"
  ],
  "env": {
    "development": {
    },
    "testing": {
    },
    "staging": {
    },
    "production": {
    }
  }
};
