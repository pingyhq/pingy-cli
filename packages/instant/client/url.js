module.exports = function urlFn(s) {
  var o = new Option();
  o.innerHTML = '<a>';
  o.firstChild.href = s;
  o.innerHTML += '';
  return o.firstChild;
};

module.exports.getExt = function getExt(url) {
  if (typeof url !== 'string') return null;
  return (url = url.substr(1 + url.lastIndexOf('/')).split('?')[0])
    .split('#')[0]
    .substr(url.lastIndexOf('.'));
};
