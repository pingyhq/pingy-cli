'use strict';

var Path = require('path');
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));
var accord = require('accord');
var minify = require('./minify');

var extensionMap;
var loadedAdapters;
var targetExtension;
var sourceExtension;

// Whitelisted adapters
var adapters = [
  'LiveScript',
  'babel',
  'coco',
  'coffee-script',
  'dogescript',
  'less',
  'markdown',
  'myth',
  'scss',
  'stylus',
  'swig',
  'jade'
];


function load() {
  extensionMap = {};
  loadedAdapters = [];

  Object.keys(accord.all()).map(function (engine) {
    if (adapters.indexOf(engine) === -1) {
      return undefined;
    }

    try {
      return accord.load(engine, global.babyTolkCompilerModulePath);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' && e.message.indexOf('Cannot find module') === -1) {
        console.error(e.message.replace(/^error: ?/i, 'Accord Error: ') + '. Try updating to the latest version');
      }
      // else {
      //   console.error('Missing adapter:', engine);
      // }
    }
  }).filter(function (engine) {
    return engine;
  }).forEach(function (adapter) {
    if (adapter.engineName === 'babel' || adapter.engineName === 'babel-core') {
      // Monkey-patching Babel adapter so that it doesn't try and compile all .js files
      adapter.extensions = ['jsx', 'es6', 'babel'];
    }
    loadedAdapters.push(adapter);
    var extensions = adapter.extensions.map(function (extension) { return '.' + extension; });

    extensions.forEach(function (extension) {
      if (!Array.isArray(extensionMap[extension])) {
        extensionMap[extension] = [];
      }

      extensionMap[extension].push(adapter);
    });
  });

  targetExtension = {};
  sourceExtension = {};

  Object.keys(extensionMap).forEach(function (sourceExt) {
    var adapters = extensionMap[sourceExt];
    var targetExt = '.' + adapters[0].output;

    targetExtension[sourceExt] = targetExt;


    if (!sourceExtension[targetExt]) {
      sourceExtension[targetExt] = [];
    }

    sourceExtension[targetExt].push(sourceExt);
  });
}
load();

var dontCompile = function (pathName) {
  // Baby Tolk wont compile files that begin with an underscore `_`.
  // This is by convention.
  var baseName = Path.basename(pathName);
  return baseName[0] === '_';
};

module.exports = {
  get extensions() {
    return extensionMap;
  },
  get sourceExtensionMap() {
    return sourceExtension;
  },
  get targetExtensionMap() {
    return targetExtension;
  },
  reload: load,
  adapters: loadedAdapters,
  isMinifiable: minify.isMinifiable,
  read: function (pathName, options) {
    options = options || {};

    options.sourceMap = options.sourceMap === false ? false : true;

    var extension = Path.extname(pathName);
    var adapters = extensionMap[extension];
    var adapter = !dontCompile(pathName) && adapters && adapters[0];

    var continuation;

    if (adapter) {
      var transpilerOptions = Object.assign({}, options, {
        sourcemap: options.sourceMap
      });

      if (adapter.engineName === 'node-sass') {
        transpilerOptions.includePaths = [Path.dirname(pathName)];
      }

      var addInfo = function(compiled) {
        compiled.extension = '.' + adapter.output;
        compiled.inputPath = pathName;
        return when.resolve(compiled);
      };

      continuation = adapter.renderFile(pathName, transpilerOptions).then(addInfo);

    } else {
      continuation = fs.readFile(pathName, 'utf8').then(function (source) {
        return when.resolve({
          result: source,
          extension: extension,
          inputPath: pathName
        });
      });
    }

    if (options.minify) {
      continuation = continuation.then(function(compiled) {
        return minify(compiled, options);
      });
    }

    return continuation;
  }
};
