'use strict';

var path = require('path');
var CleanCSS = require('clean-css');
var UglifyJS = require('uglify-js');
var htmlMinify = require('html-minifier').minify;

// TODO: A lot of funky stuff goes on when normailizing the sourcemaps after
// minification. This should be documented.

var css = function(compiled) {
  var options = {
    sourceMap: compiled.sourcemap ? JSON.stringify(compiled.sourcemap) : true
  };
  var compiledFile;
  if (compiled.sourcemap) {
    compiledFile = compiled.sourcemap.file;
  }
  var minified = new CleanCSS(options).minify(compiled.result);
  compiled.result = minified.styles;
  compiled.sourcemap = minified.sourceMap.toJSON();
  if (compiled.sourcemap.sources[0] === '$stdin') {
    compiled.sourcemap.sources[0] = compiled.inputPath;
  }
  if (!compiled.sourcemap.file) {
    compiled.sourcemap.file = compiledFile || path.basename(compiled.inputPath);
  }
  return compiled;
};

var js = function(compiled) {
  var options = {
    fromString: true,
    outSourceMap: compiled.inputPath + '.map',
    filename: compiled.inputPath
  };
  if (compiled.sourcemap) {
    options.inSourceMap = compiled.sourcemap;
  }

  var ug;
  try {
    ug = UglifyJS.minify(compiled.result, options);
  } catch (err) {
    err.filename = compiled.inputPath;
    throw err;
  }

  // Remove sourceMappingURL comment line
  ug.code = ug.code.substring(0, ug.code.lastIndexOf('\n'));
  compiled.sourcemap = JSON.parse(ug.map);
  if (compiled.sourcemap.sources[0] === '?') {
    compiled.sourcemap.sources[0] = compiled.inputPath;
  }
  if (compiled.sourcemap.file) {
    // Bugfix for: https://github.com/mishoo/UglifyJS2/issues/764
    var nFileName = path.basename(compiled.sourcemap.file, '.map');
    var ext = path.extname(nFileName);
    if (ext !== '.js') {
      nFileName = path.basename(nFileName, ext) + '.js';
    }
    compiled.sourcemap.file = nFileName;
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

var cssExtentions = ['.css'];
var htmlExtentions = ['.html', '.htm'];
var jsExtentions = ['.js'];
var allExtentions = cssExtentions.concat(htmlExtentions).concat(jsExtentions);

var isCss = function(extension) {
  return cssExtentions.indexOf(extension) > -1;
};

var isHtml = function(extension) {
  return htmlExtentions.indexOf(extension) > -1;
};

var isJs = function(extension) {
  return jsExtentions.indexOf(extension) > -1;
};

var isMinifiable = function(extension) {
  return allExtentions.indexOf(extension) > -1;
};

module.exports = function(compiled, options) {
  options = options || {};
  if (isCss(compiled.extension)) {
    compiled = css(compiled);
  } else if (isJs(compiled.extension)) {
    compiled = js(compiled);
  } else if (isHtml(compiled.extension)) {
    compiled = html(compiled);
  } else {
    return compiled;
  }
  compiled.minified = true;
  if (!options.sourceMap) {
    compiled.sourcemap = null;
    delete compiled.sourcemap;
  }
  return compiled;
};

module.exports.css = css;
module.exports.js = js;
module.exports.html = html;
module.exports.minifiable = allExtentions;
module.exports.isMinifiable = isMinifiable;
