Baconize
========

[![npm version](https://badge.fury.io/js/baconize.svg)](https://badge.fury.io/js/baconize)
[![Build Status](https://travis-ci.org/davej/baconize.svg?branch=master)](https://travis-ci.org/davej/baconize)

Compile/minify static site for production (with sourcemaps), auto-compiles files like `app.coffee -> app.js`.

Currently supports: `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `jade`, `node-sass`, `stylus`, `swig`. To use any of these you must do `npm install x` as needed (where `x` is the name of the lib), baconize does not install them by default.

Example
-------

```javascript
var baconize = require('baconize');

var source = '/path/to/input/dir';
var target = '/path/to/output/dir';
baconize(source, target, [options]).then([successFn],[errorFn]);
```

How it works:
  * Baconize will walk your source directory and process each file in `/path/to/input/dir`:
  * If it can compile a file then it will compile it and output it to the target directory (with source map).
  * If it *can't* compile the file then it will simply copy it to the target.

For example, if you have a coffeescript file in `/path/to/input/dir/my-app/scripts/index.coffee` then it will output the compiled file as `/path/to/output/dir/my-app/scripts/index.js`, and the sourcemap as `/path/to/output/dir/my-app/scripts/index.js.map`.

This library is designed for use alongside [pingy-in-the-middle](https://github.com/davej/piggy-in-the-middle).


Options
-------

- **compile** (Boolean, default = true): should baconize try to compile files where possible?

- **sourcemaps** (Boolean, default = true): should baconize copy corresponding sourcemaps and source files for the minified/compiled files?

- **minify** (Boolean, default = false): should baconize minify javascript, css and html files? Will also minify post-compilation files.

- **blacklist** (Array): filter to blacklist files from being compiled or minifed. They will still be copied (without compilation/minifiction) unless they are negated using the `fileFilter` or `directoryFilter` options below. This option is useful for vendor directories (like 'bower_components') which already include the compiled versions of files. See [Filters](#filters) for more.

- **fileFilter** (Array): filter to include/exclude files to be copied to target. See [Filters](#filters) for more.

- **directoryFilter** (Array): filter to include/exclude directories to be copied to target, rules are applied to sub-directories also. Useful for directories like '.git'. See [Filters](#filters) for more.

- **depth** (Number): depth at which to stop recursing even if more subdirectories are found.

- **exclusions** (Object): Instead of `blacklist`, `fileFilter` and `directoryFilter` you can use the new exclusions api, this is undocumented for the moment.


Filters
-------

Filters take an array of glob strings. `fileFilter` and `directoryFilter` can be a whitelist or blacklist, by default they are whitelist but add the `!` character before entries to turn them into a blacklist instead:

* `compileBlacklist: [ 'bower_components/**' ]` copies the raw 'bower_components' directory instead of compiling files within the directory.

* `fileFilter: [ '*.json', '*.js', '*.scss', '*.jade' ]` includes *only* JavaScript, JSON, SCSS and Jade files.

* `directoryFilter: [ '!.git', '!node_modules' ]` includes all directories *except* '.git' and 'node_modules'.

See [minimatch](https://github.com/isaacs/minimatch) for some examples of glob strings.


Events
------

You can listen to `chdir` and `compile-start` and `compile-finised` events emitted by baconize.
```javascript
var bacon = baconize(source, target, [options]);

bacon.on('chdir', function(folder) {
  // `folder` (string) is the current folder path that is being processed by baconize
});

bacon.on('compile-start', function(file) {
  // compile has started on `file` (object).
  //
  // {
  //    name: 'typography.css',
  //    path: 'styles/typography.css',
  //    fullPath: '/Users/dave/Sites/my-site/styles/typography.css',
  //    parentDir: 'styles',
  //    fullParentDir: '/Users/dave/Sites/my-site/styles/',
  //    stat: {object} See: https://nodejs.org/api/fs.html#fs_class_fs_stats
  // }
});

bacon.on('compile-done', function(file) {
  // compile has finished successfully on `file` (object, see above).
});
```

Aborting while in progress
--------------------------

You can abort baconize while it's in progress.
If you do this then the promise will reject and the output directory will be removed.

```javascript
var bacon = baconize(source, target, [options]);

// abort baconize while in progress
setTimeout(function() { bacon.abort(); }, 10);

bacon.then(function(){}, function(err) {
  // err (Error)
  // {
  //    message: 'Manually aborted by user',
  //    code: 'ABORT'
  // }
})
```

Try it out
----------
The easiest way to try this out is to `clone` the repo, `cd` into it and do:

```sh
npm install
npm run example
```

This will compile a basic demo site to `examples/output`.
