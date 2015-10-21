'use strict';

var chokidar = require('chokidar');

module.exports = (function() {
  function Cache(mountPath) {
    // Set-up cache and watchers
    this.cache = {};
    this.watchers = [];
    this.mountPath = mountPath;
  }

  Cache.prototype.exists = function(compiledPath) {
    return compiledPath in this.cache;
  };

  Cache.prototype.get = function (compiledPath) {
    return this.cache[compiledPath];
  };

  Cache.prototype['delete'] = function(compiledPath) {
    if (compiledPath in this.cache) {
      this.cache[compiledPath] = null;
      delete this.cache[compiledPath];
    }
  };

  Cache.prototype.add = function (sourcePath, compiledPath, compiled) {
    this._add(compiledPath, compiled);
    var sources = this._getSources(compiled, sourcePath);
    this._addWatcher(compiledPath, sources);
  };

  Cache.prototype._getSources = function(compiled, sourcePath) {
    var sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(function (src) {
        return src.substring(1);
      });
    }
    return sources || [sourcePath];
  };

  Cache.prototype._add = function(compiledPath, contents) {
    if (contents) {
      this.cache[compiledPath] = contents;
    }
  };

  Cache.prototype._addWatcher = function(compiledPath, sources) {
    var _this = this;

    if (!(compiledPath in this.watchers)) {
      chokidar.watch(sources, {
        cwd: this.mountPath
      })
      // TODO: Trigger a browser reload event on change/unlink
      .on('change', function () {
        return _this['delete'](compiledPath);
      }).on('unlink', function () {
        return _this['delete'](compiledPath);
      });
      this.watchers.push(compiledPath);
    }
  };

  return Cache;
})();
