Baconize
========

[![npm version](https://badge.fury.io/js/baconize.svg)](https://badge.fury.io/js/baconize)
[![Build Status](https://travis-ci.org/davej/baconize.svg?branch=master)](https://travis-ci.org/davej/baconize)

Compile static site for production (with sourcemaps), auto-compiles files like `app.coffee -> app.js`.

This is a very early version with almost no test coverage but give it a shot and report any issues. Currently supports: `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `jade`, `node-sass`, `stylus`, `swig`. To use any of these you must do `npm install x` as needed (where `x` is the name of the lib), baconize does not install them by default.

Example
-------

```javascript
var baconize = require('baconize');

var source = '/path/to/input/dir';
var target = '/path/to/output/dir';
baconize(source, target).then([successFn],[errorFn]);
```

How it works:
  * Baconize will walk your source directory and process each file in `/path/to/input/dir`:
  * If it can compile a file then it will compile it and output it to the target directory (with source map).
  * If it *can't* compile the file then it will simply copy it to the target.

For example, if you have a coffeescript file in `/path/to/input/dir/my-app/scripts/index.coffee` then it will output the compiled file as `/path/to/output/dir/my-app/scripts/index.js`, and the sourcemap as `/path/to/output/dir/my-app/scripts/index.js.map`.


This library is designed for use alongside [pingy-in-the-middle](https://github.com/davej/piggy-in-the-middle).

Try it out
----------
The easiest way to try this out is to `clone` the repo, `cd` into it and do:

```sh
npm install
npm run example
```

This will compile a basic demo site to `examples/output`.
