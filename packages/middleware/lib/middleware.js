'use strict';

const babyTolk = require('@pingy/compile');
const helpers = require('./helpers');
const Cache = require('./cache');
const events = require('events');
const csserror = require('csserror');
const jserror = require('jserror');
const path = require('path');

module.exports = function piggy(mountPath, options) {
  const eventEmitter = new events.EventEmitter();
  const cache = Cache(mountPath, eventEmitter);

  const middleware = function piggyMiddleware(req, rsp, next) {
    req.url = helpers.fixReqRoot(req.url);
    const isSrcMap = helpers.isSourceMap(req.url);
    const fullPath = helpers.getFullPath(mountPath, req.url);
    const compiledPath = helpers.getCompiledPath(req.url);
    const fullCompiledPath = helpers.getCompiledPath(fullPath);

    if (cache.exists(compiledPath)) {
      return helpers.render(200, fullPath, cache.get(compiledPath), isSrcMap, rsp);
    }

    const renderCompiledFile = function renderCompiledFile(compiled) {
      if (!compiled) {
        return next();
      }
      cache.add(sourcePath, compiledPath, compiled);
      helpers.render(200, fullPath, compiled, isSrcMap, rsp);
    };

    let sourcePath;
    const setSourcePath = function (sp) {
      sourcePath = sp;
      return sp;
    };

    const fixSourceMapLinks = function (compiled) {
      return helpers.fixSourceMapLinks(mountPath, compiled);
    };

    const forwardCompilationError = function (err) {
      if (err && err.toString) {
        const ext = path.extname(compiledPath);
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
      .then(filePath => babyTolk.read(filePath, options)) // Compile source file using babyTolk
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
