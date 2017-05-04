'use strict';

const path = require('path');
const connect = require('connect');
const serveStatic = require('serve-static');
const instant = require('@pingy/instant');
const enableDestroy = require('server-destroy');

function serveSite(sitePath, port) {
  global.babyTolkCompilerModulePath = path.join(sitePath, 'node_modules');
  const pingyMiddleware = require('@pingy/middleware');

  const server = connect();
  enableDestroy(server);

  const $instant = instant(sitePath);
  const $serveStatic = serveStatic(sitePath);
  const $pingy = pingyMiddleware(sitePath);

  server.use($instant);
  server.use($serveStatic);
  server.use($pingy);

  $pingy.events.on('fileChanged', $instant.reload);

  server.listen(port);
  const url = `http://localhost:${port}`;
  return {
    server,
    url,
    pingy: $pingy,
    instant: $instant,
  };
}

function exportSite(inputDir, outputDir, options) {
  global.babyTolkCompilerModulePath = path.join(inputDir, 'node_modules');
  return require('@pingy/export')(inputDir, outputDir, options);
}

module.exports = {
  serveSite,
  exportSite,
};
