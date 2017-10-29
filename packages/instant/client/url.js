module.exports = function (s) {
  const o = new Option()
  o.innerHTML = '<a>'
  o.firstChild.href = s
  o.innerHTML += ''
  return o.firstChild
}

module.exports.getExt = function (url) {
  if (typeof url !== 'string') return
  return (url = url.substr(1 + url.lastIndexOf('/')).split('?')[0])
    .split('#')[0]
    .substr(url.lastIndexOf('.'))
}
