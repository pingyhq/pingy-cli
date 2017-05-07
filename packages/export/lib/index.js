'use strict';

var babyTolk = require('@pingy/compile');
var readdirp = require('readdirp');
var through = require('through2');
var path = require('path');
var pathCompleteExtname = require('path-complete-extname');
var when = require('when');
var fs = require('fs');
var mm = require('micromatch');
var events = require('events');
var checkDir = require('checkdir');
var nodefn = require('when/node');
var crypto = require('crypto');
var rimraf = nodefn.lift(require('rimraf'));
var mkdirp = nodefn.lift(require('mkdirp'));
var fsp = nodefn.liftAll(fs);

// TODO: Consider using node-glob module instead of readdirp + through2
// I think that will simplify the code.

var extname = function (filePath) {
  var ext = path.extname(filePath);
  if (babyTolk.targetExtensionMap[ext]) {
    return ext;
  }
  return pathCompleteExtname(filePath);
};

var replaceExtension = function (filePath, newExtension) {
  var ext = extname(filePath);
  return filePath.slice(0, -ext.length) + newExtension;
};

var addSrcExtension = function (filePath) {
  var ext = extname(filePath);
  return replaceExtension(filePath, `.src${ext}`);
};

var useExclusionsApi = function (options, outputDir) {
  const excludeDirs = options.exclusions
    .filter(excl => excl.action === 'exclude' && excl.type === 'dir')
    .map(excl => excl.path);

  options.directoryFilter = (entry) => {
    if (entry.name[0] === '.') return false;
    if (entry.fullPath === outputDir) return false;
    return !mm([entry.path], excludeDirs).length;
  };
  options.fileFilter = options.exclusions
    .filter(excl => excl.action === 'exclude' && excl.type === 'file')
    .map(excl => `!${excl.path}`)
    .concat('!**/.*');

  options.blacklist = options.exclusions
    .filter(excl => excl.action === 'dontCompile' && excl.type === 'dir')
    .map(excl => `${excl.path}/**`)
    .concat(
      options.exclusions
        .filter(excl => excl.action === 'dontCompile' && excl.type === 'file')
        .map(excl => excl.path)
    );

  options.directoryFilter = options.directoryFilter.length ? options.directoryFilter : null;
  options.fileFilter = options.fileFilter.length ? options.fileFilter : null;
  options.blacklist = options.blacklist.length ? options.blacklist : null;
  return options;
};

var createHash = function (data) {
  var shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

var noop = () => null;

module.exports = function (inputDir, outputDir, options) {
  var eventEmitter = new events.EventEmitter();
  var shasFilename = '.shas.json';
  var fileWhitelist = [shasFilename];
  var filesCopied = 0;
  options = options || {};
  var previousDir = null;
  var abortRequested = false;
  var shas = [];
  var shasPath = path.join(outputDir, shasFilename);
  var existingShas;

  // Default compile and minify options to `true`
  options.compile = options.compile !== false;
  options.sourcemaps = options.sourcemaps !== false;

  var babyTolkOptions = {
    minify: options.minify,
    sourceMap: options.sourcemaps,
    inputSha: true,
  };

  if (options.exclusions) {
    useExclusionsApi(options, outputDir);
  }

  var readAndValidateShas = function () {
    var getMainFile = (sha) => {
      var files = sha.output;
      var mainFile = files[files.length - 1];
      return path.join(outputDir, mainFile);
    };

    var getInputFile = sha => path.join(inputDir, sha.input);

    return fsp
      .readFile(shasPath, 'utf8')
      .then((contents) => {
        existingShas = JSON.parse(contents);

        var matchingCompilerShas = existingShas.filter(
          sha => babyTolk.getTransformId(getInputFile(sha), babyTolkOptions) === sha.type
        );

        var outFiles = existingShas.map(
          sha => sha && fsp.readFile(getMainFile(sha), 'utf8').then(contents => contents, noop)
        );

        // Verify that the output file hasn't changed
        return when
          .all(outFiles)
          .then(fileContents =>
            matchingCompilerShas.filter(
              (sha, i) => fileContents[i] && sha.outputSha === createHash(fileContents[i])
            )
          );
      })
      .then(filtered =>
        // Verify that the input files haven't changed
        when
          .all(
            filtered.map(sha =>
              when.all(
                sha.inputSha.map(input =>
                  fsp
                    .readFile(path.join(inputDir, input.file), 'utf8')
                    .then(contents => input.sha === createHash(contents))
                )
              )
            )
          )
          .then((equalShaBoolArr) => {
            var filterBools = equalShaBoolArr.map(
              // i.e.. [true, true, false] => false
              x => x.reduce((prev, curr) => prev && curr, true)
            );
            return filtered.filter((el, i) => filterBools[i]);
          })
      )
      .then(
        (filtered) => {
          if (!Array.isArray(filtered)) {
            return;
          }
          return {
            input: filtered.map(x => x.input),
            // Flatten output files to single array
            output: [].concat.apply([], filtered.map(x => x.output)),
          };
        },
        noop // ignore errors (shas are not required, just good for perf)
      );
  };

  var compileAndCopy = function (reusableFiles) {
    babyTolk.reload();
    return when
      .promise((resolve, reject) => {
        options.root = inputDir;
        var stream = readdirp(options);

        stream
          .pipe(
            through.obj(
              (file, _, next) => {
                if (abortRequested) {
                  var err = new Error('Manually aborted by user');
                  err.code = 'ABORT';
                  return reject(err);
                }
                var outputFullPath = path.join(outputDir, file.path);
                var doCompile = !mm(file.path, options.blacklist).length;

                var addFileToWhitelist = (filePath) => {
                  fileWhitelist.push(filePath);
                };

                var fileDone = function () {
                  if (previousDir !== file.parentDir) {
                    eventEmitter.emit('chdir', file.parentDir);
                    previousDir = file.parentDir;
                  }
                  filesCopied += 1;
                  next();
                };

                var processFile = function () {
                  var ext = extname(file.name);
                  var compileExt = babyTolk.targetExtensionMap[ext];

                  var compile = function () {
                    if (reusableFiles && Array.isArray(reusableFiles.input)) {
                      var reuseExistingFile = reusableFiles.input.indexOf(file.path) > -1;
                      if (reuseExistingFile) {
                        var previousSha = existingShas.find(sha => sha.input === file.path);
                        if (previousSha) {
                          shas.push(previousSha);
                        }
                        eventEmitter.emit('compile-reuse', file);
                        previousSha.output.forEach(addFileToWhitelist);
                        return when.resolve(false);
                      }
                    }

                    eventEmitter.emit('compile-start', file);

                    return babyTolk.read(file.fullPath, babyTolkOptions).then((compiled) => {
                      var relativePath = path.relative(inputDir, compiled.inputPath);
                      var writeFiles = [],
                        fileNames = [];

                      var fileName = file.name;
                      var compiledOutputFullPath = outputFullPath;
                      var extensionChanged = false;
                      if (ext !== compiled.extension) {
                        extensionChanged = true;
                        compiledOutputFullPath = replaceExtension(
                          compiledOutputFullPath,
                          compiled.extension
                        );
                        fileName = replaceExtension(file.name, compiled.extension);
                      }

                      if (compiled.sourcemap) {
                        var sourcemapStr = `sourceMappingURL=${fileName}.map`;

                        compiled.sourcemap.sources = compiled.sourcemap.sources
                          .map(source => path.resolve(process.cwd(), source))
                          .map(source => source.replace(inputDir, outputDir))
                          .map(source =>
                            path.relative(path.dirname(compiledOutputFullPath), source)
                          )
                          .map(source => (extensionChanged ? source : addSrcExtension(source)));

                        var srcMapFileName = `${compiledOutputFullPath}.map`;
                        writeFiles.push(
                          fsp.writeFile(srcMapFileName, JSON.stringify(compiled.sourcemap))
                        );
                        fileNames.push(path.relative(outputDir, srcMapFileName));
                        if (compiled.extension === '.css') {
                          /* # sourceMappingURL=screen.css.map */
                          compiled.result = `${compiled.result}\n/*# ${sourcemapStr}*/`;
                        } else if (compiled.extension === '.js') {
                          // # sourceMappingURL=script.js.map
                          compiled.result = `${compiled.result}\n//# ${sourcemapStr}`;
                        }
                      }

                      writeFiles.push(fsp.writeFile(compiledOutputFullPath, compiled.result));
                      fileNames.push(path.relative(outputDir, compiledOutputFullPath));

                      shas.push({
                        type: compiled.transformId,
                        inputSha: compiled.inputSha.map(x => ({
                          file: path.relative(inputDir, x.file),
                          sha: x.sha,
                        })),
                        outputSha: createHash(compiled.result),
                        input: relativePath,
                        output: fileNames,
                      });
                      eventEmitter.emit('compile-done', file);
                      return when.all(writeFiles).then(() => {
                        fileNames.forEach(addFileToWhitelist);
                      });
                    });
                  }; // End compile Fn

                  var copy = function (renameToSrc) {
                    var rs = fs.createReadStream(file.fullPath);
                    var writePath = renameToSrc ? addSrcExtension(outputFullPath) : outputFullPath;
                    var ws = fs.createWriteStream(writePath);
                    addFileToWhitelist(path.relative(outputDir, writePath));
                    rs.pipe(ws).on('error', reject);
                    ws.on('finish', fileDone).on('error', reject);
                  };

                  if (options.compile && compileExt && doCompile) {
                    // compile
                    compile().then(() => (options.sourcemaps ? copy() : fileDone()), reject);
                  } else if (babyTolk.isMinifiable(ext) && options.minify && doCompile) {
                    // minify
                    compile().then(
                      () => (options.sourcemaps ? copy(true) : fileDone()),
                      () => copy()
                    );
                  } else {
                    copy();
                  }
                };

                var dir = path.dirname(outputFullPath);
                mkdirp(dir).then(processFile, reject);
              },
              (next) => {
                resolve(filesCopied);
                next();
              }
            )
          )
          .on('error', reject);
      })
      .then((filesCopied) => {
        eventEmitter.emit('cleaning-up');
        return when.promise((resolve, reject) => {
          readdirp({
            root: outputDir,
            fileFilter: file => fileWhitelist.indexOf(file.path) === -1,
          })
            .pipe(
              through.obj(
                (file, _, next) => {
                  fs.unlink(file.fullPath);
                  next();
                },
                (finish) => {
                  resolve(filesCopied);
                  finish();
                }
              )
            )
            .on('error', reject);
        });
      });
  };

  var promise = readAndValidateShas()
    .then(compileAndCopy)
    .then(numFiles => fsp.writeFile(shasPath, JSON.stringify(shas, null, 2)).then(() => numFiles))
    // TODO: Don't delete dir after abort. Leave as is instead.
    .catch(err =>
      // If there was an error then back out, delete the output dir and forward
      // the error up the promise chain
      rimraf(outputDir).then(() => when.reject(err))
    );

  promise.abort = function () {
    abortRequested = true;
  };
  promise.events = eventEmitter;
  return promise;
};

module.exports.preflight = function preflight(inputDir, outputDir) {
  var checks = [
    checkDir(inputDir),
    checkDir(path.join(inputDir, 'node_modules')),
    checkDir(path.join(inputDir, 'bower_components'))
  ];
  if (outputDir) checks.push(checkDir(outputDir));
  return Promise.all(checks).then((info) => {
    var mainDir = info[0];
    var nodeModules = info[1];
    var bowerComponents = info[2];
    var outputDir = info[3];
    return Object.assign(
      {},
      mainDir,
      { nodeModules: nodeModules.exists },
      { bowerComponents: bowerComponents.exists },
      { outputDir: outputDir || null }
    );
  });
};
