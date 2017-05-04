'use strict';

var babyTolk = require('@pingy/compile');
var helpers = require('./helpers');
var Cache = require('./cache');
var events = require('events');
var csserror = require('csserror');
var jserror = require('jserror');
var path = require('path');

module.exports = function piggy(mountPath) {
  var eventEmitter = new events.EventEmitter();
  var cache = Cache(mountPath, eventEmitter);

  var middleware = function piggyMiddleware(req, rsp, next) {
    var isSrcMap = helpers.isSourceMap(req.url);
    var fullPath = helpers.getFullPath(mountPath, req.url);
    var compiledPath = helpers.getCompiledPath(req.url);
    var fullCompiledPath = helpers.getCompiledPath(fullPath);

    if (cache.exists(compiledPath)) {
      return helpers.render(200, fullPath, cache.get(compiledPath), isSrcMap, rsp);
    }

    var renderCompiledFile = function renderCompiledFile(compiled) {
      if (!compiled) {
        return next();
      }
      cache.add(sourcePath, compiledPath, compiled);
      helpers.render(200, fullPath, compiled, isSrcMap, rsp);
    };

    var sourcePath;
    var setSourcePath = function (sp) {
      sourcePath = sp;
      return sp;
    };

    var fixSourceMapLinks = function (compiled) {
      return helpers.fixSourceMapLinks(mountPath, compiled);
    };

    var forwardCompilationError = function (err) {
      if (err && err.toString) {
        var ext = path.extname(compiledPath);
        err = err.toString();
        if (ext === '.css') {
          err = csserror(err);
        } else if (ext === '.js') {
          err = jserror(err);
        }
        return helpers.render(200, fullPath, { result: err }, false, rsp);
      }
    };

    return helpers
      .findSourceFile(fullCompiledPath, babyTolk)
      .then(setSourcePath)
      .then(babyTolk.read) // Compile source file using babyTolk
      .then(fixSourceMapLinks, forwardCompilationError)
      .then(renderCompiledFile, next); // No specific error handling for the moment
  };

  middleware.reload = function reload() {
    babyTolk.reload();
    cache.delAll();
  };
  middleware.events = eventEmitter;

  return middleware;
};

module.exports.reloadCompilers = babyTolk.reload;
