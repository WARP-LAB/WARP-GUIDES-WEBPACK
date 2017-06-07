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
