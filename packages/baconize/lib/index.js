'use strict';

var babyTolk = require('baby-tolk');
var readdirp = require('readdirp');
var through = require('through2');
var path = require('path');
var nodefn = require('when/node');
var when = require('when');
var rimraf = nodefn.lift(require('rimraf'));
var mkdirp = nodefn.lift(require('mkdirp'));
var fs = require('fs');
var fsp = nodefn.liftAll(require('fs'));
var filesCopied = 0;

module.exports = function(inputDir, outputDir, options) {

  var compileAndCopy = function() {
    return when.promise(function(resolve, reject) {
      var stream = readdirp({ root: inputDir, options: options });

      stream.pipe(through.obj(function (file, _, next) {

        var fileDone = function() {
          filesCopied = filesCopied + 1;
          next();
        };

        var processFile = function() {
          var ext = path.extname(file.name);
          var compileExt = babyTolk.targetExtensionMap[ext];
          var outputFullPath = path.join(outputDir, file.path);

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

          if (!!compileExt) {
            compile();
          } else {
            copy();
          }
        };
        var dir = path.join(outputDir, file.path.replace(file.name, ''));
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
