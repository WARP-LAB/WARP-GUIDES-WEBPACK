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
