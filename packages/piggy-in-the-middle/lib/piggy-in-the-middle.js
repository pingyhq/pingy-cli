'use strict';

var babyTolk = require('baby-tolk');
var helpers = require('./helpers');
var Cache = require('./cache');

module.exports = function(mountPath) {
  var cache = new Cache(mountPath);

  return function(req, rsp, next) {
    var isSrcMap = helpers.isSourceMap(req.url);
    var fullPath = helpers.getFullPath(mountPath, req.url);
    var compiledPath = helpers.getCompiledPath(fullPath);

    if (cache.exists(compiledPath)) {
      return helpers.render(200, fullPath, cache.get(compiledPath), isSrcMap, rsp);
    }

    var renderCompiledFile = function renderCompiledFile(compiled) {
      if (!compiled && compiled.result) {
        return next();
      }
      cache.add(sourcePath, compiledPath, compiled);
      helpers.render(200, fullPath, compiled, isSrcMap, rsp);
    };

    var sourcePath;
    var setSourcePath = function(sp) {
      sourcePath = sp;
      return sp;
    };

    var fixSourceMapLinks = function(compiled) {
      return helpers.fixSourceMapLinks(mountPath, compiled);
    };

    return helpers.findSourceFile(compiledPath)
      .then(setSourcePath)
      .then(babyTolk.read) // Compile source file using babyTolk
      .then(fixSourceMapLinks)
      .then(renderCompiledFile, next); // No specific error handling for the moment
  };
};
