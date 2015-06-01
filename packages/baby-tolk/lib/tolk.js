'use strict';

var Path = require('path');
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));
var accord = require('accord');
var inlineSourceMapComment = require('inline-source-map-comment');

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
    // console.error('Missing adapter:', engine);
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

function inlineSourceMap (isCss, compiled) {
  var result = compiled.result;

  if (compiled.sourcemap) {
    var comment = inlineSourceMapComment(compiled.sourcemap, {
      block: isCss
    });

    result += '\n' + comment + '\n';
  }

  return when.resolve(result);
}

var autoprefixer = require('./autoprefix').config({ browsers: ['last 2 versions'] });

module.exports = function (pathName) {
  var adapters = extensionMap[Path.extname(pathName)];
  var adapter = adapters && adapters[0];
  var isCss = Path.extname(pathName) === '.css';

  var continuation;

  if (adapter) {
    isCss = adapter.output === 'css';
    continuation = adapter.renderFile(pathName, { sourcemap: true }).then(inlineSourceMap.bind(this, isCss));
  } else {
    continuation = fs.readFile(pathName, 'utf8');
  }

  if (isCss) {
    continuation = continuation.then(autoprefixer);
  }

  return continuation;
};
