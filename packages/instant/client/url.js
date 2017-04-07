module.exports = function(s) {
  var o = new Option()
  o.innerHTML = '<a>'
  o.firstChild.href = s
  o.innerHTML += ''
  return o.firstChild
}