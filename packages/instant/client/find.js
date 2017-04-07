var parseUrl = require('./url')

/**
 * Find the first element with the given tag-name whoes property `prop`
 * matches the specified url.
 */
exports.byURL = function(name, prop, url) {
  var el = document.getElementsByTagName(name)
  for (var i=0; i < el.length; i++)
    if (parseUrl(el[i][prop]).pathname == url.pathname) return el[i]
}

exports.bySelector = function(sel) {
  return document.querySelector && document.querySelector(sel)
}

exports.byClass = function(cls) {
  return exports.bySelector('.' + cls)
}
