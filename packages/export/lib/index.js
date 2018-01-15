'use strict';

const babyTolk = require('@pingy/compile');
const readdirp = require('readdirp');
const through = require('through2');
const path = require('upath');
const fsp = require('fs-extra');
const mm = require('micromatch');
const events = require('events');
const util = require('util');
require('util.promisify').shim();
const rimraf = util.promisify(require('rimraf'));
const mkdirp = util.promisify(require('mkdirp'));
const {
  noop,
  createHash,
  useExclusionsApi,
  addSrcExtension,
  replaceExtension,
  extname,
  checkIfShaEqual,
  checkIfCompilerTypeIsEqual,
  fixSources,
  getMainFile,
  removeDuplicateInputShas,
  checkIfInputShasMatch,
} = require('./helpers');
const preflight = require('./preflight');

// TODO: Consider using node-glob module instead of readdirp + through2
// I think that will simplify the code.

module.exports = function exporter(_inputDir, _outputDir, _options) {
  const inputDir = path.normalize(_inputDir);
  const outputDir = path.normalize(_outputDir);
  const options = _options || {};

  const eventEmitter = new events.EventEmitter();
  const shasFilename = '.shas.json';
  const fileWhitelist = [shasFilename];
  let filesCopied = 0;
  let previousDir = null;
  let abortRequested = false;
  const shas = [];
  const shasPath = path.join(outputDir, shasFilename);
  let existingShas;

  // Default compile and minify options to `true`
  options.compile = options.compile !== false;
  options.sourceMap = options.sourceMap !== false;

  const babyTolkOptions = {
    minify: options.minify,
    sourceMap: options.sourceMap,
    autoprefix: options.autoprefix,
    inputSha: true,
    tsc: options.tsc || {},
  };

  if (options.exclusions) {
    useExclusionsApi(options, outputDir);
  }

  function readAndValidateShas() {
    return fsp
      .readFile(shasPath, 'utf8')
      .then(contents => {
        existingShas = JSON.parse(contents);

        const validShas = existingShas.filter(sha => !!sha);

        const outFiles = validShas.map(
          sha =>
            sha &&
            fsp
              .readFile(getMainFile(outputDir, sha), 'utf8')
              .then(outContents => outContents, noop)
        );

        // Verify that the output file hasn't changed
        return Promise.all(outFiles).then(fileContents =>
          validShas
            .filter(checkIfShaEqual(fileContents))
            .filter(checkIfCompilerTypeIsEqual(inputDir, babyTolkOptions))
        );
      })
      .then(filtered =>
        // Verify that the input files haven't changed
        Promise.all(
          filtered.map(filteredSha =>
            Promise.all(
              removeDuplicateInputShas(filteredSha.inputSha).map(
                checkIfInputShasMatch(inputDir)
              )
            )
          )
        ).then(equalShaBoolArr => {
          const filterBools = equalShaBoolArr.map(
            // i.e.. [true, true, false] => false
            x => x.reduce((prev, curr) => prev && curr, true)
          );
          return filtered.filter((el, i) => filterBools[i]);
        })
      )
      .then(
        filtered => {
          if (!Array.isArray(filtered)) {
            return null;
          }
          return {
            input: filtered.map(x => x.input),
            // Flatten output files to single array
            // eslint-disable-next-line prefer-spread
            output: [].concat.apply([], filtered.map(x => x.output)),
          };
        },
        noop // ignore errors (shas are not required, just good for perf)
      );
  }

  function compileAndCopy(reusableFiles) {
    babyTolk.reload();
    return new Promise((resolve, reject) => {
      options.root = inputDir;
      const stream = readdirp(options);

      stream
        .pipe(
          through.obj(
            (file, _, next) => {
              /* eslint-disable no-param-reassign */
              file.path = path.normalize(file.path);
              file.fullPath = path.normalize(file.fullPath);
              file.parentDir = path.normalize(file.parentDir);
              file.fullParentDir = path.normalize(file.fullParentDir);
              /* eslint-enable no-param-reassign */

              if (abortRequested) {
                const err = new Error('Manually aborted by user');
                err.code = 'ABORT';
                reject(err);
                return;
              }
              const outputFullPath = path.join(outputDir, file.path);
              const doCompile = !mm(file.path, options.blacklist).length;

              const addFileToWhitelist = filePath => {
                fileWhitelist.push(filePath);
              };

              function fileDone() {
                if (previousDir !== file.parentDir) {
                  eventEmitter.emit('chdir', file.parentDir);
                  previousDir = file.parentDir;
                }
                filesCopied += 1;
                next();
              }

              function processFile() {
                const ext = extname(file.name);
                const compileExt = babyTolk.targetExtensionMap[ext];

                function compile() {
                  if (reusableFiles && Array.isArray(reusableFiles.input)) {
                    const reuseExistingFile =
                      reusableFiles.input.indexOf(file.path) > -1;
                    if (reuseExistingFile) {
                      const previousSha = existingShas.find(
                        sha => sha.input === file.path
                      );
                      if (previousSha) {
                        shas.push(previousSha);
                      }
                      eventEmitter.emit('compile-reuse', file);
                      previousSha.output.forEach(addFileToWhitelist);
                      return Promise.resolve(false);
                    }
                  }

                  eventEmitter.emit('compile-start', file);

                  return babyTolk
                    .read(file.fullPath, babyTolkOptions)
                    .then(compiled => {
                      const relativePath = path.relative(
                        inputDir,
                        compiled.inputPath
                      );
                      const writeFiles = [];
                      const fileNames = [];

                      let fileName = file.name;
                      let compiledOutputFullPath = outputFullPath;
                      let extensionChanged = false;
                      if (ext !== compiled.extension) {
                        extensionChanged = true;
                        compiledOutputFullPath = replaceExtension(
                          compiledOutputFullPath,
                          compiled.extension
                        );
                        fileName = replaceExtension(
                          file.name,
                          compiled.extension
                        );
                      }

                      if (compiled.sourcemap) {
                        const sourcemapStr = `sourceMappingURL=${fileName}.map`;
                        // TODO: Should fixSource be moved to @pingy/compile?
                        // eslint-disable-next-line no-param-reassign
                        compiled.sourcemap.sources = fixSources(
                          compiled.sourcemap.sources,
                          inputDir,
                          outputDir,
                          compiledOutputFullPath,
                          extensionChanged
                        );

                        const srcMapFileName = `${compiledOutputFullPath}.map`;
                        writeFiles.push(
                          fsp.writeFile(
                            srcMapFileName,
                            JSON.stringify(compiled.sourcemap)
                          )
                        );
                        fileNames.push(
                          path.relative(outputDir, srcMapFileName)
                        );
                        if (compiled.extension === '.css') {
                          /* # sourceMappingURL=screen.css.map */
                          // eslint-disable-next-line no-param-reassign
                          compiled.result = `${
                            compiled.result
                          }\n/*# ${sourcemapStr}*/`;
                        } else if (compiled.extension === '.js') {
                          // # sourceMappingURL=script.js.map
                          // eslint-disable-next-line no-param-reassign
                          compiled.result = `${
                            compiled.result
                          }\n//# ${sourcemapStr}`;
                        }
                      }

                      writeFiles.push(
                        fsp.writeFile(compiledOutputFullPath, compiled.result)
                      );
                      fileNames.push(
                        path.relative(outputDir, compiledOutputFullPath)
                      );

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
                      return Promise.all(writeFiles).then(() => {
                        fileNames.forEach(addFileToWhitelist);
                      });
                    });
                } // End compile Fn

                function copy(renameToSrc) {
                  const rs = fsp.createReadStream(file.fullPath);
                  const writePath = renameToSrc
                    ? addSrcExtension(outputFullPath)
                    : outputFullPath;
                  const ws = fsp.createWriteStream(writePath);
                  addFileToWhitelist(path.relative(outputDir, writePath));
                  rs.pipe(ws).on('error', reject);
                  ws.on('finish', fileDone).on('error', reject);
                }

                const shouldCompile =
                  options.compile && compileExt && doCompile;
                const shouldMinify =
                  babyTolk.isMinifiable(ext) && options.minify && doCompile;
                const shouldAutoprefix =
                  options.autoprefix && ext === '.css' && doCompile;

                if (shouldCompile) {
                  // compile
                  return compile().then(
                    () => (options.sourceMap ? copy() : fileDone()),
                    reject
                  );
                } else if (shouldMinify || shouldAutoprefix) {
                  // minify
                  return compile().then(
                    () => (options.sourceMap ? copy(true) : fileDone()),
                    () => copy()
                  );
                }
                return copy();
              }

              const dir = path.dirname(outputFullPath);
              mkdirp(dir).then(processFile, reject);
            },
            next => {
              resolve();
              next();
            }
          )
        )
        .on('error', reject);
    }).then(() => {
      eventEmitter.emit('cleaning-up');
      return new Promise((resolve, reject) => {
        readdirp({
          root: outputDir,
          fileFilter: file =>
            fileWhitelist.indexOf(path.normalize(file.path)) === -1,
        })
          .pipe(
            through.obj(
              (file, _, next) => {
                fsp.unlink(file.fullPath);
                next();
              },
              finish => {
                resolve(filesCopied);
                finish();
              }
            )
          )
          .on('error', reject);
      });
    });
  }

  const promise = readAndValidateShas()
    .then(compileAndCopy)
    .then(numFiles =>
      fsp
        .writeFile(shasPath, JSON.stringify(shas, null, 2))
        .then(() => numFiles)
    )
    // TODO: Don't delete dir after abort. Leave as is instead.
    .catch(err =>
      // If there was an error then back out, delete the output dir and forward
      // the error up the promise chain
      rimraf(outputDir).then(() => Promise.reject(err))
    );

  promise.abort = () => {
    abortRequested = true;
  };
  promise.events = eventEmitter;
  return promise;
};

module.exports.preflight = preflight;
