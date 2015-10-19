Baby Tolk
====

[![NPM version](https://badge.fury.io/js/baby-tolk.svg)](http://badge.baby-fury.io/js/tolk)
[![Build Status](https://travis-ci.org/davej/baby-tolk.svg?branch=master)](https://travis-ci.org/davej/baby-tolk)
[![Coverage Status](https://img.shields.io/coveralls/davej/baby-tolk.svg)](https://coveralls.io/r/davej/baby-tolk?branch=master)
[![Dependency Status](https://david-dm.org/davej/baby-tolk)](https://david-dm.org/davej/baby-tolk)

Baby Tolk is a "do the right thing" tool for transpiling. It reads a file from the file system, transpiles it (including sourcemaps where supported) with the available transpilers. This is based on the [Tolk](https://github.com/Munter/tolk) but does less things based on the "small modules that do one thing" philosophy.

Returns a promise that resolves with the resulting transpiler output.

Installing the individual transpilers baby tolk should use is up to the consumer. There are no transpiler dependencies out of the box. So if you only need babel and sass, install `babel` and `node-sass`.

Tolk is useful for tools that handle precompiling for you, but might also be used directly in your task runner of preference in order to skip some of the many plugins that do the same but worse.

**Current precompiler support:** `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `node-sass`, `stylus`, `swig`


Usage
-----

```
npm install baby-tolk
```

Out of the box this won't transpile anything. In order to do more, for example babel and sass, also do this:

```
npm install node-sass babel
```

Now you are ready to start reading files from the file system. Tolk automatically loads the transpilers it has access to in the scope it is run in.

```js
var tolk = require('tolk');

tolk.read('path/to/stylesheet.scss').done(function (compiled) {
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


License
-------
(The MIT License)

Copyright (c) 2015 Dave Jeffery <dave@davejeffery.com>
Copyright (c) 2015 Peter Müller <munter@fumle.dk>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
