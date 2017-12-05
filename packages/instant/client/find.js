var parseUrl = require('./url');

// Find the first element with the given tag-name whoes property `prop`
// matches the specified url.

exports.byURL = function byURL(name, prop, url) {
  var el = document.getElementsByTagName(name);
  for (var i = 0; i < el.length; i++) {
    if (parseUrl(el[i][prop]).pathname === url.pathname) return el[i];
  }
  return null;
};

exports.allByURLExceptMe = function allByURLExceptMe(name, prop, url, meEl) {
  var el = document.getElementsByTagName(name);
  var els = [];
  for (var i = 0; i < el.length; i++) {
    if (parseUrl(el[i][prop]).pathname === url.pathname && el[i] !== meEl) {
      els.push(el[i]);
    }
  }
  return els;
};

exports.bySelector = function bySelector(sel) {
  return document.querySelector && document.querySelector(sel);
};

exports.byClass = function byClass(cls) {
  return exports.bySelector('.' + cls);
};
