'use strict';

var chokidar = require('chokidar');

module.exports = class Cache {

  constructor(mountPath) {
    // Set-up cache and watchers
    this.cache = {};
    this.watchers = [];
    this.mountPath = mountPath;
  }

  exists(compiledPath) {
    return compiledPath in this.cache;
  }

  get(compiledPath) {
    return this.cache[compiledPath];
  }

  delete(compiledPath) {
    if (compiledPath in this.cache) {
      this.cache[compiledPath] = null;
      delete this.cache[compiledPath];
    }
  }

  add(sourcePath, compiledPath, compiled) {
    this._add(compiledPath, compiled);
    var sources = this._getSources(compiled, sourcePath);
    this._addWatcher(compiledPath, sources);
  }

  _getSources(compiled, sourcePath) {
    var sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(src => src.substring(1));
    }
    return sources || [sourcePath];
  }

  _add(compiledPath, contents) {
    if (contents) {
      this.cache[compiledPath] = contents;
    }
  }

  _addWatcher(compiledPath, sources) {
    if (!(compiledPath in this.watchers)) {
      chokidar.watch(sources, {
        cwd: this.mountPath
      })
      // TODO: Trigger a browser reload event on change/unlink
      .on('change', () => this.delete(compiledPath))
      .on('unlink', () => this.delete(compiledPath));
      this.watchers.push(compiledPath);
    }
  }

};
