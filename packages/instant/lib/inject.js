var tamper = require('tamper')

/**
 * Returns a middleware that injects a script tag with the given URL before
 * the closing body tag of text/html responses.
 */
module.exports = function(script) {
  return tamper(function(req, res) {
    var url = req.realUrl || req.url
      , mime = res.getHeader('Content-Type')

    if (/text\/html/.test(mime) && !/instant\/events/.test(url)) {
      return function(body) {
        return body.replace(/<\/body>/i,
          '  <script src="' + script + '"></script>\n</body>')
      }
    }
  })
}
