'use strict';

var babyTolk = require('baby-tolk');
var readdirp = require('readdirp');
var through = require('through2');
var path = require('path');
var when = require('when');
var fs = require('fs');
var mm = require('micromatch');
var nodefn = require('when/node');
var rimraf = nodefn.lift(require('rimraf'));
var mkdirp = nodefn.lift(require('mkdirp'));
var fsp = nodefn.liftAll(require('fs'));
var filesCopied = 0;

module.exports = function(inputDir, outputDir, options) {
  options = options || {};

  var compileAndCopy = function() {
    return when.promise(function(resolve, reject) {
      options.root = inputDir;
      var stream = readdirp(options);

      stream.pipe(through.obj(function (file, _, next) {
        var outputFullPath = path.join(outputDir, file.path);

        var fileDone = function() {
          filesCopied = filesCopied + 1;
          next();
        };

        var processFile = function() {
          var ext = path.extname(file.name);
          var compileExt = babyTolk.targetExtensionMap[ext];

          var compile = function() {
            babyTolk.read(file.fullPath).then(function(compiled) {
              var writeFiles = [];
              outputFullPath = outputFullPath.replace(ext, compileExt);

              if (compiled.sourcemap) {
                var fileName = file.name.replace(ext, compileExt);
                var sourcemapStr = 'sourceMappingURL=' + fileName + '.map';
                compiled.sourcemap.sources = compiled.sourcemap.sources.map(function(source) {
                  return path.basename(source);
                });
                writeFiles.push(fsp.writeFile(outputFullPath+ '.map', JSON.stringify(compiled.sourcemap)));
                if (compileExt === '.css') {
                  /*# sourceMappingURL=screen.css.map */
                  compiled.result = compiled.result + '\n/*# ' + sourcemapStr + '*/';
                } else if (compileExt === '.js') {
                  //# sourceMappingURL=script.js.map
                  compiled.result = compiled.result + '\n//# ' + sourcemapStr;
                }
              }

              writeFiles.push(fsp.writeFile(outputFullPath, compiled.result));
              return when.all(writeFiles);
            }).then(fileDone, reject);
          };

          var copy = function() {
            var rs = fs.createReadStream(file.fullPath);
            var ws = fs.createWriteStream(outputFullPath);
            rs.pipe(ws).on('error', reject);
            ws.on('finish', fileDone).on('error', reject);
          };

          var doCompile = !mm(file.path, options.compileBlacklist).length;

          if (!!compileExt && doCompile) {
            compile();
          } else {
            copy();
          }
        };


        var dir = outputFullPath.slice(0,-(file.name.length));
        mkdirp(dir).then(processFile, reject);
      }, function (next) {
        resolve(filesCopied);
        next();
      })).on('error', reject);
    });
  };

  return rimraf(outputDir)
    .then(compileAndCopy)
    .catch(function(err) {
      // If there was an error then back out, delete the output dir and forward
      // the error up the promise chain
      rimraf(outputDir);
      return when.reject(err);
    });
};
