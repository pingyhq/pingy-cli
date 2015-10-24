Piggy In The Middle
===================

[![npm version](https://badge.fury.io/js/piggy-in-the-middle.svg)](https://badge.fury.io/js/piggy-in-the-middle)
[![Build Status](https://travis-ci.org/davej/piggy-in-the-middle.svg?branch=master)](https://travis-ci.org/davej/piggy-in-the-middle)

Express/Connect middleware for transpiling to html/css/js on-the-fly. Also gives you sourcemaps and caching for unchanged files.

This is a very early version with almost no test coverage but give it a shot and report any issues. Currently supports: `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `jade`, `node-sass`, `stylus`, `swig`.

It works a bit like this:
  1. A request comes in for `app.js`
  2. `app.js` can not be found (`404`)
  3. PITM will look for files that compile to `app.js`
  4. It finds `app.coffee`
  5. `app.coffee` is compiled on-the-fly
  6. The compiled output is served to the browser as `app.js`

Subsequent requests will not force a recompile file because PITM will cache the output. PITM is smart and will watch the source file(s) for changes, if you change a source file then it will do a recompile on next request.


Try it out
----------  
The easiest way to try this out is to `clone` the repo, `cd` into it and do:

```sh
npm install
npm run example
```

This will start a basic demo site using PITM.


Use as middleware
-----------------
Here's a really simple example:

```javascript
var connect = require('connect');
var serveStatic = require('serve-static');
var pitm = require('piggy-in-the-middle');

var app = connect();

app.use(serveStatic('/path/to/your/site'));
app.use(pitm('/path/to/your/site'));

app.listen(3000);
```

Once initialized PITM will also emit 'fileChanged' events whenever a watched file
is changed, this is useful for doing live reloading of the browser.
For example, to integrate PITM with [browser-sync](http://www.browsersync.io/)
you can do something like this:

```javascript
var pitm = require('piggy-in-the-middle');
var browserSync = require('browser-sync').create();

var piggy = pitm('/path/to/your/site');
piggy.events.on('fileChanged', browserSync.reload);
```
