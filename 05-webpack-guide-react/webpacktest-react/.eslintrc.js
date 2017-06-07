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
