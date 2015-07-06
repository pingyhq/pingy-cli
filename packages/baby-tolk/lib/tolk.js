'use strict';

var Path = require('path');
var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));

var accord = require('accord');
var inlineSourceMapComment = require('inline-source-map-comment');

var autoprefixer = require('autoprefixer-core');
var postcss = require('postcss');

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

  if (compiled.sourcemap) {
    var result = compiled.result;
    var comment = inlineSourceMapComment(compiled.sourcemap, {
      block: isCss
    });

    result += '\n' + comment + '\n';

    compiled.result = result;
  }

  return when.resolve(compiled);
}

module.exports = {
  extensions: extensionMap,
  adapters: loadedAdapters,
  read: function (pathName, options) {
    options = options || {};

    options.sourceMap = options.sourceMap === false ? false : true;
    if (options.browsers) {
      if (typeof options.browsers === 'string') {
        options.browsers = [options.browsers];
      }
    } else {
      options.browsers = ['last 2 versions'];
    }


    var adapters = extensionMap[Path.extname(pathName)];
    var adapter = adapters && adapters[0];
    var isCss = Path.extname(pathName) === '.css';

    var continuation;

    if (adapter) {
      isCss = adapter.output === 'css';

      var transpilerOptions = {
        sourcemap: options.sourceMap
      };

      if (adapter.engineName === 'node-sass') {
        transpilerOptions.includePaths = [Path.dirname(pathName)];
      }

      continuation = adapter.renderFile(pathName, transpilerOptions).then(inlineSourceMap.bind(this, isCss));
    } else {
      continuation = fs.readFile(pathName, 'utf8').then(function (source) {
        return when.resolve({
          result: source
        });
      });
    }

    if (isCss) {
      continuation = continuation.then(function (compiled) {
        return postcss([autoprefixer(({ browsers: options.browsers }))]).process(compiled.result).then(function (result) {
          compiled.result = result.css;
          return compiled;
        });
      });
    }

    return continuation;
  }
};
