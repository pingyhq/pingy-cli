'use strict';

const filewatcher = require('filewatcher');
const { normalize, join, relative } = require('upath');
const isAbsolute = require('is-absolute');

module.exports = function Cache(mountPath, events) {
  // Set-up cache and watchers
  const cache = {};
  const watcher = filewatcher();
  const watchers = {};
  const sourceToCompiledMap = {};

  (function init() {
    // eslint-disable-next-line no-use-before-define
    watcher.on('change', onFileChange);
  })();

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

  function absolutePath(source) {
    if (isAbsolute(source)) return source;
    return join(mountPath, source);
  }

  function relativizePath(absoluteSource) {
    return relative(mountPath, absoluteSource);
  }

  function onFileChange(sourceFile) {
    const relativeSource = relativizePath(sourceFile);
    const compiledPath = sourceToCompiledMap[relativeSource];

    del(compiledPath);
    events.emit('fileChanged', compiledPath, relativeSource);
  }

  function exists(compiledPath) {
    return compiledPath in cache;
  }

  function get(compiledPath) {
    return cache[compiledPath];
  }

  function getSources(compiled, sourcePath) {
    let sources;
    if (compiled.sourcemap) {
      // Remove preceeding slash to make the path relative (instead of absolute)
      sources = compiled.sourcemap.sources.map(src => src.substring(1));
    } else if (compiled.manuallyTrackedSourceFiles) {
      sources = compiled.manuallyTrackedSourceFiles.concat(sourcePath);
    }

    return sources || [sourcePath];
  }

  function addWatcher(compiledPath, sources) {
    const normalizedCompilePath = normalize(compiledPath);

    sources.forEach(source => {
      const absoluteSource = absolutePath(source);
      const relativeSource = relativizePath(absoluteSource);
      sourceToCompiledMap[relativeSource] = normalizedCompilePath;

      watcher.add(absoluteSource);
    });

    if (!watchers[normalizedCompilePath]) {
      watchers[normalizedCompilePath] = sources;
    } else {
      watchers[normalizedCompilePath] = watchers[normalizedCompilePath].concat(
        sources
      );
    }
  }

  function preAddWatcher(compiledPath, sources) {
    if (!watchers[compiledPath]) {
      addWatcher(compiledPath, sources);
    } else {
      const newSources = sources.filter(
        src => watchers[compiledPath].indexOf(src) === -1
      );
      addWatcher(compiledPath, newSources);
    }
  }

  function add(sourcePath, compiledPath, compiled) {
    if (compiled) {
      cache[compiledPath] = compiled;
    }
    const sources = getSources(compiled, sourcePath);
    preAddWatcher(compiledPath, sources);
  }

  return {
    exists,
    get,
    del,
    delAll,
    add,
  };
};
