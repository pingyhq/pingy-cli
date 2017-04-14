module.exports = {
    "extends": "airbnb-base",
    "env": {
      "node": true,
      "mocha":true
    },
    "plugins": [
        "import"
    ],
    "parserOptions": {
      "ecmaVersion": 6,
      "sourceType": "script",
      "ecmaFeatures": {
        "modules": false
      }
    },
    "rules": {
      "strict": ["error", "global"],
      "comma-dangle": ["error", {
        "arrays": "never",
        "objects": "always-multiline",
        "imports": "never",
        "exports": "never",
        "functions": "ignore"
      }]
    }
};
