'use strict';

// Polfill Promise for old node versions
require('es6-promise');

var Path = require('path');
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));

var accord = require('accord');

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
  'swig'
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

module.exports = {
  extensions: extensionMap,
  adapters: loadedAdapters,
  read: function (pathName, options) {
    options = options || {};

    options.sourceMap = options.sourceMap === false ? false : true;

    var adapters = extensionMap[Path.extname(pathName)];
    var adapter = adapters && adapters[0];

    var continuation;

    if (adapter) {
      var transpilerOptions = {
        sourcemap: options.sourceMap
      };

      if (adapter.engineName === 'node-sass') {
        transpilerOptions.includePaths = [Path.dirname(pathName)];
      }

      continuation = adapter.renderFile(pathName, transpilerOptions);
    } else {
      continuation = fs.readFile(pathName, 'utf8').then(function (source) {
        return when.resolve({
          result: source
        });
      });
    }

    return continuation;
  }
};
