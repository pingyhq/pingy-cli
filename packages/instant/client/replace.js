/**
 * Replace `el` with a new <link rel="stylesheet"> tag using the given URL.
 * We have to create a new element instead of simply updating the `href`
 * attribute of the existing link, since some browsers otherwise  would not
 * immediately repaint the page.
 */
 module.exports = function(el, href) {
  var p = el.parentNode
  var ref = el.nextSibling
  var s = document.createElement('link')
  s.rel = 'stylesheet'
  s.type = 'text/css'
  s.href = href
  s.onload = function() {
    p.removeChild(el)
  }
  p.insertBefore(s, ref)
}
