'use strict';

var Path = require('path');
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));
var accord = require('accord');
var minify = require('./minify');

var extensionMap = {};
var loadedAdapters = [];

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

Object.keys(accord.all()).map(function (engine) {
  if (adapters.indexOf(engine) === -1) {
    return undefined;
  }

  try {
    return accord.load(engine);
  } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
      console.error(e.message.replace(/^error: ?/i, 'Accord Error: ') + '. Try updating to the latest version');
    }
    // else {
    //   console.error('Missing adapter:', engine);
    // }
  }
}).filter(function (engine) {
  return engine;
}).forEach(function (adapter) {
  loadedAdapters.push(adapter);
  var extensions = adapter.extensions.map(function (extension) { return '.' + extension; });

  extensions.forEach(function (extension) {
    if (!Array.isArray(extensionMap[extension])) {
      extensionMap[extension] = [];
    }

    extensionMap[extension].push(adapter);
  });
});

var targetExtension = {};
var sourceExtension = {};

Object.keys(extensionMap).forEach(function (sourceExt) {
  var adapters = extensionMap[sourceExt];
  var targetExt = '.' + adapters[0].output;

  targetExtension[sourceExt] = targetExt;


  if (!sourceExtension[targetExt]) {
    sourceExtension[targetExt] = [];
  }

  sourceExtension[targetExt].push(sourceExt);
});

module.exports = {
  extensions: extensionMap,
  sourceExtensionMap: sourceExtension,
  targetExtensionMap: targetExtension,
  adapters: loadedAdapters,
  isMinifiable: minify.isMinifiable,
  read: function (pathName, options) {
    options = options || {};

    options.sourceMap = options.sourceMap === false ? false : true;

    var extension = Path.extname(pathName);
    var adapters = extensionMap[extension];
    var adapter = adapters && adapters[0];

    var continuation;

    if (adapter) {
      var transpilerOptions = {
        sourcemap: options.sourceMap
      };

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
