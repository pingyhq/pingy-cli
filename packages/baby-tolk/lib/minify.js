'use strict';

var CleanCSS = require('clean-css');
var UglifyJS = require('uglify-js');
var htmlMinify = require('html-minifier').minify;

var css = function(compiled) {
  var options = {
    sourceMap: compiled.sourcemap ? JSON.stringify(compiled.sourcemap) : true
  };
  var minified = new CleanCSS(options).minify(compiled.result);
  compiled.result = minified.styles;
  compiled.sourcemap = minified.sourceMap.toJSON();
  if (compiled.sourcemap.sources[0] === '$stdin') {
    compiled.sourcemap.sources[0] = compiled.inputPath;
  }
  return compiled;
};

var js = function(compiled) {
  var options = {
    fromString: true,
    outSourceMap: compiled.inputPath + '.map',
    filename: compiled.inputPath
  };
  if (compiled.sourcemap) { options.inSourceMap = compiled.sourcemap; }
  var ug = UglifyJS.minify(compiled.result, options);
  // Remove sourceMappingURL comment line
  ug.code = ug.code.substring(0, ug.code.lastIndexOf('\n'));
  compiled.sourcemap = JSON.parse(ug.map);
  if (compiled.sourcemap.sources[0] === '?') {
    compiled.sourcemap.sources[0] = compiled.inputPath;
  }
  compiled.result = ug.code;
  return compiled;
};

var html = function(compiled) {
  var options = {
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyAttributes: true
  };
  compiled.result = htmlMinify(compiled.result, options);
  return compiled;
};

module.exports = function(compiled) {
  if (compiled.extension === '.css') {
    return css(compiled);
  } else if (compiled.extension === '.js') {
    return js(compiled);
  } else if (compiled.extension === '.html') {
    return html(compiled);
  }
  return compiled;
};

module.exports.css = css;
module.exports.js = js;
module.exports.html = html;
