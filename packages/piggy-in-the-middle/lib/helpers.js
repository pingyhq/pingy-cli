'use strict';

var when = require('when');
var node = require('when/node');
var fs = node.liftAll(require('fs'));
var path = require('path');
var babyTolk = require('baby-tolk');
var mime = require('mime');
require('array.prototype.find'); // Polyfill

var helpers = {

  /**
   * Render a response
   * @param  {number}  statusCode     HTTP status code (e.g. 200)
   * @param  {string}  pth            Path used for guessing mime-type from extension
   * @param  {string}  body           Compiled object passed from baby-tolk
   * @param  {boolean} isSrcMap       `true` is this a sourcemap
   * @param  {Object}  rsp            Connect/Express response Object
   */
  render: function render(statusCode, pth, compiled, isSrcMap, rsp) {
    var extension = path.extname(pth);
    var mimeType = mime.lookup(extension);
    var charset = mime.charsets.lookup(mimeType);
    rsp.statusCode = statusCode;

    var body;
    if (isSrcMap) {
      body = compiled.sourcemap;
    } else {
      if (compiled.sourcemap) {
        // Add source map link to resonse header
        rsp.setHeader('X-SourceMap', path.basename(pth) + '.map');
      }
      body = compiled.result;
    }

    if (typeof body === 'object') {
      body = JSON.stringify(body);
    }
    rsp.setHeader('Content-Type', mimeType + (charset ? '; charset=' + charset : ''));
    rsp.setHeader('Content-Length', Buffer.byteLength(body, charset));
    rsp.end(body);
  },

  /**
   * Checks if the path corresponds to a sourcemap
   * @param  {string}  pth Path/url to check
   * @return {Boolean}     Is this a source map?
   */
  isSourceMap: function isSourceMap(pth) {
    return path.extname(pth) === '.map';
  },

  /**
   * Sourcemap sources seem to have full filesystem paths, which isn't useful
   * when served from a web server this makes them relative to the mount path.
   * 		/User/John/foo/bar/my-site/styles/main.scss => /styles/main.scss
   * @param  {string} mountPath
   * @param  {Object} compiled
   * @return {Object}           Modified compiled object with fixed sourcemap sources
   */
  fixSourceMapLinks: function fixSourceMapLinks(mountPath, compiled) {
    if (compiled && compiled.sourcemap) {
      compiled.sourcemap.sources = compiled.sourcemap.sources.map(function(source) {
        return '/' + path.relative(mountPath, source);
      });
    }
    return compiled;
  },

  /**
   * 1. Removes query params and unescapes
   * 2. Joins url with the mount path
   * 3. If it's a root path then look for 'index.html'
   * @param  {string} mountPath Directory where source files are stored
   * @param  {string} url       Request url path
   * @return {string}           Full path to compiled file
   */
  getFullPath: function getFullPath(mountPath, url) {
    var base = unescape(url.split('?')[0]);
    var fullPath = path.join(mountPath, base);

    // converts unix paths to windows path on windows (not sure if this is a good thing)
    fullPath = path.normalize(fullPath);

    // index.html support
    if (path.sep === fullPath[fullPath.length - 1]) {
      fullPath += 'index.html';
    }
    return fullPath;
  },

  /**
   * Removes the '.map' extension to reveal the source file
   * @param  {string} pth path/url
   * @return {string}     path/url
   */
  getCompiledPath: function getCompiledPath(pth) {
    if (path.extname(pth) === '.map') {
      // Remove map extension to simplify workflow.
      // We'll add the extension back at the end.
      pth = pth.slice(0, -4);
    }
    return pth;
  },

  /**
   * Lists all paths to potential source files
   * @param  {string} compiledFile
   * @return {Array}               paths to potential source files
   */
  listPotentialSourceFiles: function listPotentialSourceFiles(compiledFile) {
    var compiledExtension = path.extname(compiledFile);
    var targetExtensions = babyTolk.sourceExtensionMap[compiledExtension] || [];

    return targetExtensions.map(function(extension) {
      return compiledFile.replace(compiledExtension, extension);
    });
  },

  /**
   * Find the corresponding source file when given the path to the compiled file
   * @param  {string}                compiledFile path
   * @return {Promise<string, null>}              path to source file or reject with null
   */
  findSourceFile: function findSourceFile(compiledFile) {
    var dir = path.dirname(compiledFile);
    var potentialSourceFiles = this.listPotentialSourceFiles(compiledFile);

    if (!potentialSourceFiles.length) {
      // Exit early instead of doing pointless IO
      return when.reject(null);
    }

    return fs.readdir(dir).then(function(files) {
      // Find the first source file match in dir
      var sourceFile = files.map(
      // Give files their full path
      function(file) {
        return path.join(dir, file);
      }).find(function(file) {
        return potentialSourceFiles.find(function(potentialSource) {
          return potentialSource === file;
        });
      });
      return sourceFile || when.reject(null);
    }, function() {
      return when.reject(null);
    });
  }

};

module.exports = helpers;
