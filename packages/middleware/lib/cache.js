'use strict';

const fs = require('fs');
const { normalize, join, relative } = require('upath');
const isAbsolute = require('is-absolute');

const isMac = process.platform === 'darwin';

module.exports = function Cache(mountPath, events) {
  // Set-up cache and watchers
  const cache = {};
  const watchers = {};
  const fileChangedRecently = {};

  function exists(compiledPath) {
    return compiledPath in cache;
  }

  function get(compiledPath) {
    return cache[compiledPath];
  }

  function delAll() {
    Object.keys(cache).forEach((c) => {
      cache[c] = null;
      delete cache[c];
    });
    Object.keys(watchers).forEach((w) => {
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
    const sources = _getSources(compiled, sourcePath);
    _preAddWatcher(compiledPath, sources);
  }

  function _getSources(compiled, sourcePath) {
    let sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(src => src.substring(1));
    } else if (compiled.manuallyTrackedSourceFiles) {
      sources = compiled.manuallyTrackedSourceFiles.concat(sourcePath);
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
      const newSources = sources.filter(src => watchers[compiledPath].indexOf(src) === -1);
      _addWatcher(compiledPath, newSources);
    }
  }

  function absolutePath(source) {
    if (isAbsolute(source)) return source;
    return join(mountPath, source);
  }

  function relativizePath(absoluteSource) {
    return relative(mountPath, absoluteSource);
  }

  const onFileChange = (relativeSource, compiledPath) => () => {
    // TODO: Code below needs more testing on mac before enabling it
    if (!isMac) {
      if (fileChangedRecently[relativeSource]) return;
      fileChangedRecently[relativeSource] = true;
      setTimeout(() => (fileChangedRecently[relativeSource] = false), 50);
    }
    del(compiledPath);
    events.emit('fileChanged', compiledPath, relativeSource);
  };

  function _addWatcher(compiledPath, sources) {
    const normalizedCompilePath = normalize(compiledPath);

    sources.forEach((source) => {
      const absoluteSource = absolutePath(source);
      const relativeSource = relativizePath(absoluteSource);

      try {
        fs.watch(absoluteSource, onFileChange(relativeSource, normalizedCompilePath));
      } catch (e) {
        if (e.code === 'ENOENT') return;
        throw e;
      }
    });

    if (!watchers[normalizedCompilePath]) {
      watchers[normalizedCompilePath] = sources;
    } else {
      watchers[normalizedCompilePath] = watchers[normalizedCompilePath].concat(sources);
    }
  }

  return {
    exists,
    get,
    del,
    delAll,
    add,
  };
};
