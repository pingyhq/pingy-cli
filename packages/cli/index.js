'use strict';

const connect = require('connect');
const serveStatic = require('serve-static');
const pingyMiddleware = require('@pingy/middleware');
const instant = require('@pingy/instant');
const enableDestroy = require('server-destroy');
const pingyExport = require('@pingy/export');

function serveSite(sitePath, port) {
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

const exportSite = pingyExport.bind(pingyExport);

module.exports = {
  serveSite,
  exportSite,
};
