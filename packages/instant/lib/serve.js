var send = require('send')
  , url = require('url')

exports = module.exports = function static_(root, options) {
  if (!root) throw new Error('root path is required')

  if (!options) options = {}
  options.root = root

  var redirect = options.redirect !== false

  return function static_(req, res, next) {
    if ('GET' != req.method && 'HEAD' != req.method) return next()
    var path = url.parse(req.url).pathname

    function directory() {
      if (!redirect) return next()
      var pathname = url.parse(req.originalUrl).pathname
      res.statusCode = 301
      res.setHeader('Location', pathname + '/')
      res.end()
    }

    function error(err) {
      if (404 == err.status) return next()
      next(err)
    }

    var s = send(req, path, options)
      .on('error', error)
      .on('directory', directory)

    if (options.onfile) s.on('file', options.onfile)
    s.pipe(res)
  }
}

exports.mime = send.mime
