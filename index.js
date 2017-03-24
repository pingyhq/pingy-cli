'use strict';

const pitm = require('piggy-in-the-middle');

function createServer() {
  var connect = require('connect');
  var serveStatic = require('serve-static');
  var pitm = require('piggy-in-the-middle');

  var app = connect();

  app.use(serveStatic('/path/to/your/site'));
  app.use(pitm('/path/to/your/site'));

  app.listen(3000);
}
