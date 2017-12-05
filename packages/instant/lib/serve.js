'use strict';

const send = require('send');
const url = require('url');

function staticServe(root, options) {
  if (!root) throw new Error('root path is required');

  if (!options) options = {};
  options.root = root;

  const redirect = options.redirect !== false;

  return function staticServeReq(req, res, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const path = url.parse(req.url).pathname;

    function directory() {
      if (!redirect) return next();
      const pathname = url.parse(req.originalUrl).pathname;
      res.statusCode = 301;
      res.setHeader('Location', `${pathname}/`);
      res.end();
    }

    function error(err) {
      if (err.status === 404) return next();
      return next(err);
    }

    const s = send(req, path, options)
      .on('error', error)
      .on('directory', directory);

    if (options.onfile) s.on('file', options.onfile);
    s.pipe(res);
  };
}

module.exports = staticServe;
exports = staticServe;

exports.mime = send.mime;
