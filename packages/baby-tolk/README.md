Baby Tolk
====

[![npm version](https://badge.fury.io/js/baby-tolk.svg)](https://badge.fury.io/js/baby-tolk)
[![Build Status](https://travis-ci.org/davej/baby-tolk.svg?branch=master)](https://travis-ci.org/davej/baby-tolk)
[![Coverage Status](https://img.shields.io/coveralls/davej/baby-tolk.svg)](https://coveralls.io/r/davej/baby-tolk?branch=master)
[![Dependency Status](https://david-dm.org/davej/baby-tolk.svg)](https://david-dm.org/davej/baby-tolk)

This is based on the [Tolk](https://github.com/Munter/tolk) library but does less things based on the "small modules that do one thing" philosophy. Specifically, it doesn't inline sourcemaps and doesn't autoprefix CSS. It can also optionally minify assets, which Tolk doesn't support.

Baby Tolk is a "do the right thing" tool for transpiling. It reads a file from the file system, transpiles it (including sourcemaps where supported) with the available transpilers. It can also optionally minify the output.

Returns a promise that resolves with the resulting transpiler output.

Installing the individual transpilers baby tolk should use is up to the consumer. There are no transpiler dependencies out of the box. So if you only need babel and sass, install `babel` and `node-sass`.

Tolk is useful for tools that handle precompiling for you, but might also be used directly in your task runner of preference in order to skip some of the many plugins that do the same but worse.

**Current precompiler support:** `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `node-sass`, `stylus`, `swig`


Usage
-----

```
npm install baby-tolk
```

Out of the box this won't transpile anything (but it can minify html, css and JS). In order to do more, for example babel and sass, also do this:

```
npm install node-sass babel
```

Now you are ready to start reading files from the file system. Baby Tolk automatically loads the transpilers it has access to in the scope it is run in. You can change the scope by setting the `global.babyTolkCompilerModulePath` variable path. By convention Baby Tolk won't compile any files if the filename begins with an underscore `_` character.

```javascript
// you can set `global.babyTolkCompilerModulePath` to a specific node_modules folder if desired
// global.babyTolkCompilerModulePath = '/some/folder/node_modules';
var babyTolk = require('baby-tolk');

babyTolk.loadAdapters();

babyTolk.read('path/to/stylesheet.scss').then(function (compiled) {
  // compiled.result is the transpiled output as a string
  console.log(compiled.result);

  // compiled.sourcemap is the transpiled output as an object
  // You can use JSON.stringify to convert it to a string
  console.log(JSON.stringify(compiled.sourcemap));
}, function (err) {
  // In case anything failed
  throw err;
});
```

Want the output to be minified?

```javascript

babyTolk.read('path/to/stylesheet.scss', {minify: true}).then([success], [fail]);

```

You can also minify vanilla css/js/html files without the transpilation step.

```javascript

babyTolk.read('path/to/app.js', {minify: true}).then([success], [fail]);

```

It's also possible to turn source-maps off.

```javascript

babyTolk.read('path/to/app.js', {sourceMaps: false}).then([success], [fail]);

```

License
-------
(The MIT License)

Copyright (c) 2015 Dave Jeffery <dave@davejeffery.com>
Copyright (c) 2015 Peter Müller <munter@fumle.dk>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
