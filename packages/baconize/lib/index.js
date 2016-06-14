'use strict';

var babyTolk = require('baby-tolk');
var readdirp = require('readdirp');
var through = require('through2');
var path = require('path');
var when = require('when');
var fs = require('fs');
var mm = require('micromatch');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var nodefn = require('when/node');
var rimraf = nodefn.lift(require('rimraf'));
var mkdirp = nodefn.lift(require('mkdirp'));
var fsp = nodefn.liftAll(require('fs'));

var replaceExtension = function(filePath, newExtension) {
  var ext = path.extname(filePath);
  return filePath.slice(0,-(ext.length)) + newExtension;
};

var addSrcExtension = function(filePath) {
  var ext = path.extname(filePath);
  return replaceExtension(filePath, '.src' + ext);
};

var useExclusionsApi = function(options) {
  options.directoryFilter = options.exclusions.filter(
    excl => excl.action === 'exclude' && excl.type === 'dir'
  ).map(excl => '!' + excl.path);
  options.fileFilter = options.exclusions.filter(
    excl => excl.action === 'exclude' && excl.type === 'file'
  ).map(excl => '!' + excl.path);

  options.blacklist = options.exclusions.filter(
    excl => excl.action === 'dontCompile' && excl.type === 'dir'
  ).map(excl => excl.path + '/**').concat(
    options.exclusions.filter(
      excl => excl.action === 'dontCompile' && excl.type === 'file'
    ).map(excl => excl.path)
  )

  options.directoryFilter = options.directoryFilter.length ? options.directoryFilter : null;
  options.fileFilter = options.fileFilter.length ? options.fileFilter : null;
  options.blacklist = options.blacklist.length ? options.blacklist : null;
  return options;
}

module.exports = function(inputDir, outputDir, options) {
  var filesCopied = 0;
  options = options || {};
  var previousDir = null;
  var abortRequested = false;

  // Default compile and minify options to `true`
  options.compile = options.compile === false ? false : true;
  options.sourcemaps = options.sourcemaps === false ? false : true;

  var babyTolkOptions = {};
  babyTolkOptions.minify = options.minify;
  babyTolkOptions.sourceMap = options.sourcemaps;

  if (options.exclusions) { useExclusionsApi(options); }

  var compileAndCopy = function() {
    return when.promise(function(resolve, reject) {
      options.root = inputDir;
      var stream = readdirp(options);

      stream.pipe(through.obj(function (file, _, next) {
        if (abortRequested) {
          var err = new Error('Manually aborted by user');
          err.code = 'ABORT';
          return reject(err);
        }
        var outputFullPath = path.join(outputDir, file.path);
        var doCompile = !mm(file.path, options.blacklist).length;

        var fileDone = function() {
          if (previousDir !== file.parentDir) {
            eventEmitter.emit('chdir', file.parentDir);
            previousDir = file.parentDir;
          }
          filesCopied = filesCopied + 1;
          next();
        };

        var processFile = function() {
          var ext = path.extname(file.name);
          var compileExt = babyTolk.targetExtensionMap[ext];

          var compile = function() {
            eventEmitter.emit('compile-start', file);
            return babyTolk.read(file.fullPath, babyTolkOptions).then(function(compiled) {
              var writeFiles = [];

              var fileName = file.name;
              var compiledOutputFullPath = outputFullPath;
              var extensionChanged = false;
              if (ext !== compiled.extension) {
                extensionChanged = true;
                compiledOutputFullPath = replaceExtension(compiledOutputFullPath, compiled.extension);
                fileName = replaceExtension(file.name, compiled.extension);
              }

              if (compiled.sourcemap) {
                var sourcemapStr = 'sourceMappingURL=' + fileName + '.map';
                compiled.sourcemap.sources = compiled.sourcemap.sources.map(function(source) {
                  return path.basename(extensionChanged ? source : addSrcExtension(source));
                });
                writeFiles.push(fsp.writeFile(compiledOutputFullPath + '.map', JSON.stringify(compiled.sourcemap)));
                if (compiled.extension === '.css') {
                  /*# sourceMappingURL=screen.css.map */
                  compiled.result = compiled.result + '\n/*# ' + sourcemapStr + '*/';
                } else if (compiled.extension === '.js') {
                  //# sourceMappingURL=script.js.map
                  compiled.result = compiled.result + '\n//# ' + sourcemapStr;
                }
              }

              writeFiles.push(fsp.writeFile(compiledOutputFullPath, compiled.result));
              eventEmitter.emit('compile-done', file);
              return when.all(writeFiles);
            });
          };

          var copy = function(renameToSrc) {
            var rs = fs.createReadStream(file.fullPath);
            var writePath = renameToSrc ? addSrcExtension(outputFullPath) : outputFullPath;
            var ws = fs.createWriteStream(writePath);
            rs.pipe(ws).on('error', reject);
            ws.on('finish', fileDone).on('error', reject);
          };

          if (options.compile && compileExt && doCompile) {
            // compile
            compile().then(function() {
              if (options.sourcemaps) {
                copy();
              } else {
                fileDone();
              }
            }, reject);
          } else if (babyTolk.isMinifiable(ext) && options.minify && doCompile) {
            // minify
            compile().then(function() {
              if (options.sourcemaps) {
                copy(true);
              } else {
                fileDone();
              }
            }, reject);
          } else {
            // copy
            copy();
          }
        };


        var dir = path.dirname(outputFullPath);
        mkdirp(dir).then(processFile, reject);
      }, function (next) {
        resolve(filesCopied);
        next();
      })).on('error', reject);
    });
  };

  var promise = rimraf(outputDir)
    .then(compileAndCopy)
    .catch(function(err) {
      // If there was an error then back out, delete the output dir and forward
      // the error up the promise chain
      return rimraf(outputDir).then(function() {
        return when.reject(err);
      });
    });

  promise.abort = function() { abortRequested = true; };
  promise.events = eventEmitter;
  return promise;
};
