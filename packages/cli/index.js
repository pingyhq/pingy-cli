'use strict';

const connect = require('connect');
const serveStatic = require('serve-static');
const pingyMiddleware = require('@pingy/middleware');
const instant = require('@pingy/instant');
const EventEmitter = require('events');
const enableDestroy = require('server-destroy');
const export_ = require('@pingy/export');

function serveSite(sitePath, port) {
  const events = new EventEmitter();

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
  return {
    server,
    pingy: $pingy,
    instant: $instant,
  };
}

const exportSite = export_.bind(export_);

module.exports = exports = {
  serveSite, exportSite
}
