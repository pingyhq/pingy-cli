'use strict';

const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');
const instant = require('@pingy/instant');
const enableDestroy = require('server-destroy');
const autoprefixer = require('express-autoprefixer');

function serveSite(sitePath, options) {
  const pingyMiddleware = require('@pingy/middleware');

  const server = connect();
  enableDestroy(server);

  const $instant = instant(sitePath);
  const $serveStatic = serveStatic(sitePath);
  const $pingy = pingyMiddleware(sitePath, options);

  if (options.autoprefix) {
    if (typeof options.autoprefix === 'string') {
      options.autoprefix = [options.autoprefix];
    } else if (options.autoprefix === true) {
      options.autoprefix = 'last 2 versions';
    }
    server.use((req, res, next) => {
      if (path.extname(req.url) === '.css') {
        return autoprefixer({ browsers: options.autoprefix, cascade: false })(req, res, next);
      }
      return next();
    });
  }
  server.use($instant);
  server.use($serveStatic);
  server.use($pingy);

  $pingy.events.on('fileChanged', $instant.reload);

  server.listen(options.port);
  const url = `http://localhost:${options.port}`;
  return {
    server,
    url,
    pingy: $pingy,
    instant: $instant,
  };
}

function exportSite(inputDir, outputDir, options) {
  return require('@pingy/export')(inputDir, outputDir, options);
}

module.exports = {
  serveSite,
  exportSite,
};
