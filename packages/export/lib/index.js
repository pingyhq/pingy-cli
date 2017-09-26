'use strict';

const babyTolk = require('@pingy/compile');
const readdirp = require('readdirp');
const through = require('through2');
const path = require('upath');
const pathCompleteExtname = require('path-complete-extname');
const when = require('when');
const fs = require('fs');
const mm = require('micromatch');
const events = require('events');
const checkDir = require('checkdir');
const nodefn = require('when/node');
const crypto = require('crypto');
const rimraf = nodefn.lift(require('rimraf'));
const mkdirp = nodefn.lift(require('mkdirp'));
const fsp = nodefn.liftAll(fs);

// TODO: Consider using node-glob module instead of readdirp + through2
// I think that will simplify the code.

const extname = function (filePath) {
  const ext = path.extname(filePath);
  if (babyTolk.targetExtensionMap[ext]) {
    return ext;
  }
  return pathCompleteExtname(filePath);
};

const replaceExtension = function (filePath, newExtension) {
  const ext = extname(filePath);
  return filePath.slice(0, -ext.length) + newExtension;
};

const addSrcExtension = function (filePath) {
  const ext = extname(filePath);
  return replaceExtension(filePath, `.src${ext}`);
};

const useExclusionsApi = function (options, outputDir) {
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

const createHash = function (data) {
  const shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

const noop = () => null;

module.exports = function (inputDir, outputDir, options) {
  inputDir = path.normalize(inputDir);
  outputDir = path.normalize(outputDir);
  const eventEmitter = new events.EventEmitter();
  const shasFilename = '.shas.json';
  const fileWhitelist = [shasFilename];
  let filesCopied = 0;
  options = options || {};
  let previousDir = null;
  let abortRequested = false;
  const shas = [];
  const shasPath = path.join(outputDir, shasFilename);
  let existingShas;

  // Default compile and minify options to `true`
  options.compile = options.compile !== false;
  options.sourcemaps = options.sourcemaps !== false;

  const babyTolkOptions = {
    minify: options.minify,
    sourceMap: options.sourcemaps,
    autoprefix: options.autoprefix,
    inputSha: true,
  };

  if (options.exclusions) {
    useExclusionsApi(options, outputDir);
  }

  const readAndValidateShas = function () {
    const getMainFile = (sha) => {
      const files = sha.output;
      const mainFile = files[files.length - 1];
      return path.join(outputDir, mainFile);
    };

    const getInputFile = sha => path.join(inputDir, sha.input);

    return fsp
      .readFile(shasPath, 'utf8')
      .then((contents) => {
        existingShas = JSON.parse(contents);

        const checkIfCompilerTypeIsEqual = sha =>
          babyTolk.getTransformId(getInputFile(sha), babyTolkOptions) === sha.type;

        const checkIfShaEqual = fileContents => (sha, i) =>
          fileContents[i] && sha.outputSha === createHash(fileContents[i]);

        const validShas = existingShas.filter(sha => !!sha);

        const outFiles = validShas.map(
          sha => sha && fsp.readFile(getMainFile(sha), 'utf8').then(contents => contents, noop)
        );

        // Verify that the output file hasn't changed
        return when
          .all(outFiles)
          .then(fileContents =>
            validShas.filter(checkIfShaEqual(fileContents)).filter(checkIfCompilerTypeIsEqual)
          );
      })
      .then(filtered =>
        // Verify that the input files haven't changed
        when
          .all(
            filtered.map(sha =>
              when.all(
                sha.inputSha
                  .reduce(
                    // Remove duplicates
                    (a, b) => (a.find(sha => sha.file === b.file) ? a : a.push(b) && a),
                    []
                  )
                  .map(input =>
                    fsp
                      .readFile(path.join(inputDir, input.file), 'utf8')
                      .then(contents => input.sha === createHash(contents))
                  )
              )
            )
          )
          .then((equalShaBoolArr) => {
            const filterBools = equalShaBoolArr.map(
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

  const compileAndCopy = function (reusableFiles) {
    babyTolk.reload();
    return when
      .promise((resolve, reject) => {
        options.root = inputDir;
        const stream = readdirp(options);

        stream
          .pipe(
            through.obj(
              (file, _, next) => {
                file.path = path.normalize(file.path);
                file.fullPath = path.normalize(file.fullPath);
                file.parentDir = path.normalize(file.parentDir);
                file.fullParentDir = path.normalize(file.fullParentDir);

                if (abortRequested) {
                  const err = new Error('Manually aborted by user');
                  err.code = 'ABORT';
                  return reject(err);
                }
                const outputFullPath = path.join(outputDir, file.path);
                const doCompile = !mm(file.path, options.blacklist).length;

                const addFileToWhitelist = (filePath) => {
                  fileWhitelist.push(filePath);
                };

                const fileDone = function () {
                  if (previousDir !== file.parentDir) {
                    eventEmitter.emit('chdir', file.parentDir);
                    previousDir = file.parentDir;
                  }
                  filesCopied += 1;
                  next();
                };

                const processFile = function () {
                  const ext = extname(file.name);
                  const compileExt = babyTolk.targetExtensionMap[ext];

                  const compile = function () {
                    if (reusableFiles && Array.isArray(reusableFiles.input)) {
                      const reuseExistingFile = reusableFiles.input.indexOf(file.path) > -1;
                      if (reuseExistingFile) {
                        const previousSha = existingShas.find(sha => sha.input === file.path);
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
                      const relativePath = path.relative(inputDir, compiled.inputPath);
                      let writeFiles = [],
                        fileNames = [];

                      let fileName = file.name;
                      let compiledOutputFullPath = outputFullPath;
                      let extensionChanged = false;
                      if (ext !== compiled.extension) {
                        extensionChanged = true;
                        compiledOutputFullPath = replaceExtension(
                          compiledOutputFullPath,
                          compiled.extension
                        );
                        fileName = replaceExtension(file.name, compiled.extension);
                      }

                      if (compiled.sourcemap) {
                        const sourcemapStr = `sourceMappingURL=${fileName}.map`;

                        compiled.sourcemap.sources = compiled.sourcemap.sources
                          .map(source => path.resolve(process.cwd(), source))
                          .map(source => source.replace(inputDir, outputDir))
                          .map(source =>
                            path.relative(path.dirname(compiledOutputFullPath), source)
                          )
                          .map(source => (extensionChanged ? source : addSrcExtension(source)))
                          .map(path.normalize);

                        const srcMapFileName = `${compiledOutputFullPath}.map`;
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

                  const copy = function (renameToSrc) {
                    const rs = fs.createReadStream(file.fullPath);
                    const writePath = renameToSrc
                      ? addSrcExtension(outputFullPath)
                      : outputFullPath;
                    const ws = fs.createWriteStream(writePath);
                    addFileToWhitelist(path.relative(outputDir, writePath));
                    rs.pipe(ws).on('error', reject);
                    ws.on('finish', fileDone).on('error', reject);
                  };

                  const shouldCompile = options.compile && compileExt && doCompile;
                  const shouldMinify = babyTolk.isMinifiable(ext) && options.minify && doCompile;
                  const shouldAutoprefix = options.autoprefix && ext === '.css' && doCompile;

                  if (shouldCompile) {
                    // compile
                    compile().then(() => (options.sourcemaps ? copy() : fileDone()), reject);
                  } else if (shouldMinify || shouldAutoprefix) {
                    // minify
                    compile().then(
                      () => (options.sourcemaps ? copy(true) : fileDone()),
                      () => copy()
                    );
                  } else {
                    copy();
                  }
                };

                const dir = path.dirname(outputFullPath);
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
            fileFilter: file => fileWhitelist.indexOf(path.normalize(file.path)) === -1,
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

  const promise = readAndValidateShas()
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
  inputDir = path.normalize(inputDir);
  const checks = [
    checkDir(inputDir),
    checkDir(path.join(inputDir, 'node_modules')),
    checkDir(path.join(inputDir, 'bower_components'))
  ];
  if (outputDir) {
    outputDir = path.normalize(outputDir);
    checks.push(checkDir(outputDir));
  }
  return Promise.all(checks).then((info) => {
    const mainDir = info[0];
    const nodeModules = info[1];
    const bowerComponents = info[2];
    const outputDir = info[3];
    return Object.assign(
      {},
      mainDir,
      { nodeModules: nodeModules.exists },
      { bowerComponents: bowerComponents.exists },
      { outputDir: outputDir || null }
    );
  });
};
