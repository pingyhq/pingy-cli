module.exports = {
  extends: ['airbnb-base', 'prettier'],
  env: {
    node: true,
    mocha: true,
  },
  plugins: ['import', 'mocha'],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'script',
    ecmaFeatures: {
      modules: false,
    },
  },
  rules: {
    'mocha/no-mocha-arrows': 'error',
    strict: ['error', 'global'],
    'comma-dangle': [
      'error',
      {
        arrays: 'never',
        objects: 'always-multiline',
        imports: 'never',
        exports: 'never',
        functions: 'ignore',
      }
    ],
    'import/no-extraneous-dependencies': [
      'error',
      { devDependencies: ['**/*.test.js', '**/*.spec.js'] }
    ],
    quotes: ['error', 'single', { avoidEscape: true }],
  },
};
