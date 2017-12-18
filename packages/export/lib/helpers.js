'use strict';

const babyTolk = require('@pingy/compile');
const path = require('upath');
const crypto = require('crypto');
const pathCompleteExtname = require('path-complete-extname');
const mm = require('micromatch');
const fs = require('fs-extra');

function extname(filePath) {
  const ext = path.extname(filePath);
  if (babyTolk.targetExtensionMap[ext]) {
    return ext;
  }
  return pathCompleteExtname(filePath);
}

function replaceExtension(filePath, newExtension) {
  const ext = extname(filePath);
  return filePath.slice(0, -ext.length) + newExtension;
}

function addSrcExtension(filePath) {
  const ext = extname(filePath);
  return replaceExtension(filePath, `.src${ext}`);
}

function useExclusionsApi(_options, outputDir) {
  const options = _options;
  const excludeDirs = options.exclusions
    .filter(excl => excl.action === 'exclude' && excl.type === 'dir')
    .map(excl => excl.path);

  options.directoryFilter = entry => {
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

  options.directoryFilter = options.directoryFilter.length
    ? options.directoryFilter
    : null;
  options.fileFilter = options.fileFilter.length ? options.fileFilter : null;
  options.blacklist = options.blacklist.length ? options.blacklist : null;
  return options;
}

function createHash(data) {
  const shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
}

const noop = () => null;

const getInputFile = (inputDir, sha) => path.join(inputDir, sha.input);

const checkIfCompilerTypeIsEqual = (inputDir, babyTolkOptions) => sha =>
  babyTolk.getTransformId(getInputFile(inputDir, sha), babyTolkOptions) ===
  sha.type;

const checkIfShaEqual = fileContents => (sha, i) =>
  fileContents[i] && sha.outputSha === createHash(fileContents[i]);

const getMainFile = (outputDir, sha) => {
  const files = sha.output;
  const mainFile = files[files.length - 1];
  return path.join(outputDir, mainFile);
};

function fixSources(
  sources,
  inputDir,
  outputDir,
  compiledOutputFullPath,
  extensionChanged
) {
  return sources
    .map(source => path.resolve(process.cwd(), source))
    .map(source => source.replace(inputDir, outputDir))
    .map(source => path.relative(path.dirname(compiledOutputFullPath), source))
    .map(source => (extensionChanged ? source : addSrcExtension(source)))
    .map(path.normalize);
}

const removeDuplicateInputShas = inputShas =>
  inputShas.reduce(
    // Remove duplicates
    (a, b) => (a.find(sha => sha.file === b.file) ? a : a.push(b) && a),
    []
  );

const checkIfInputShasMatch = inputDir => input =>
  fs
    .readFile(path.join(inputDir, input.file), 'utf8')
    .then(contents => input.sha === createHash(contents));

module.exports = {
  noop,
  createHash,
  useExclusionsApi,
  addSrcExtension,
  replaceExtension,
  extname,
  checkIfCompilerTypeIsEqual,
  checkIfShaEqual,
  getMainFile,
  fixSources,
  removeDuplicateInputShas,
  checkIfInputShasMatch,
};
