'use strict';

var chokidar = require('chokidar');
var e = require('events');

module.exports = function Cache(mountPath, events) {
  // Set-up cache and watchers
  var cache = {};
  var watchers = {};

  function exists(compiledPath) {
    return compiledPath in cache;
  }

  function get(compiledPath) {
    return cache[compiledPath];
  }

  function delAll() {
    Object.keys(cache).forEach(c => {
      cache[c] = null;
      delete cache[c];
    });
    Object.keys(watchers).forEach(w => {
      watchers[w] = null;
      delete watchers[w];
    });
  }

  function del(compiledPath) {
    if (compiledPath in cache) {
      cache[compiledPath] = null;
      delete cache[compiledPath];
    }
  }

  function add(sourcePath, compiledPath, compiled) {
    _add(compiledPath, compiled);
    var sources = _getSources(compiled, sourcePath);
    _preAddWatcher(compiledPath, sources);
  }

  function _getSources(compiled, sourcePath) {
    var sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(function (src) {
        return src.substring(1);
      });
    }
    return sources || [sourcePath];
  }

  function _add(compiledPath, contents) {
    if (contents) {
      cache[compiledPath] = contents;
    }
  }

   function _preAddWatcher(compiledPath, sources) {
    if (!watchers[compiledPath]) {
      _addWatcher(compiledPath, sources);
     } else {
      var newSources = sources.filter(function(src) {
        return watchers[compiledPath].indexOf(src) === -1;
      });
      _addWatcher(compiledPath, newSources);
    }
  }

   function _addWatcher(compiledPath, sources) {
    var fileChanged = function(sourcePath) {
      del(compiledPath);
      events.emit('fileChanged', compiledPath, sourcePath);
    };

    chokidar.watch(sources, {
      cwd: mountPath
    })
    // TODO: Trigger a browser reload event on change/unlink
    .on('change', fileChanged)
    .on('unlink', fileChanged);
    if (!watchers[compiledPath]) {
      watchers[compiledPath] = sources;
    } else {
      watchers[compiledPath] = watchers[compiledPath].concat(sources);
    }
  }

  return {
    exists: exists,
    get: get,
    del: del,
    delAll: delAll,
    add: add
  };
};
