'use strict';

const {
  fixPaths,
  addInputString,
  returnOutputFilePath,
  tabTemplateAndOutput,
} = require('./helpers');
const dotPingyTmpl = require('./dotPingyTmpl');
const { writeJson, pathExists, readJson } = require('fs-extra');
const path = require('path');
const checkdir = require('checkdir');

const tabbed = { spaces: '\t' };
const filenameBlacklist = ['package.json', 'pingy.json', '.pingy.json'];

module.exports.preflight = function preflight(dirToScaffoldFrom, dirToScaffoldTo, options) {
  return checkdir(dirToScaffoldTo, { ignoreDotFiles: true }).then((dirInfo) => {
    if (!dirInfo.exists || typeof options !== 'object') return dirInfo;

    let preparedFiles;
    if (typeof options !== 'object') preparedFiles = [];
    preparedFiles = Array.isArray(options.files)
      ? options.files.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(x => x.output)
      : [];

    return Object.assign({}, dirInfo, { preparedFiles });
  });
};

module.exports.npmInit = function npmInit(dirToScaffoldTo) {
  const pkgJsonPath = path.join(dirToScaffoldTo, 'package.json');
  return pathExists(pkgJsonPath).then((pkgJsonExists) => {
    if (pkgJsonExists) return null;
    return {
      cmd: 'npm',
      args: ['init', '--yes'],
    };
  });
};

module.exports.updatePkgJson = function addPkgScripts(dirToScaffoldTo, scaffoldOptions) {
  const pkgJsonPath = path.join(dirToScaffoldTo, 'package.json');
  return readJson(pkgJsonPath).then((pkgJson) => {
    const newPkgJson = Object.assign({}, pkgJson, {
      dependencies: Object.assign({}, pkgJson.dependencies, scaffoldOptions.dependencies),
      devDependencies: Object.assign({}, pkgJson.devDependencies, scaffoldOptions.devDependencies),
      scripts: Object.assign({}, pkgJson.scripts, {
        start: 'pingy dev',
        export: 'pingy export',
      }),
    });
    return writeJson(pkgJsonPath, newPkgJson, tabbed);
  });
};

module.exports.addPingyJson = function addPingyJson(dirToScaffoldTo, scaffoldOptions) {
  const pingyJsonPath = path.join(dirToScaffoldTo, 'pingy.json');
  const dirname = path.basename(dirToScaffoldTo);
  const pingyJson = dotPingyTmpl(
    Object.assign(
      {
        name: dirname,
      },
      scaffoldOptions.pingyJson
    )
  );
  return writeJson(pingyJsonPath, pingyJson, tabbed);
};

module.exports.scaffold = function scaffold(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (typeof options !== 'object') return Promise.resolve([]);
  if (!Array.isArray(options.files)) return Promise.resolve([]);
  return Promise.all(
    options.files
      .filter(x => !filenameBlacklist.includes(x.output))
      .map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo))
      .map(addInputString)
  ).then(objs =>
    Promise.all(objs.map(tabTemplateAndOutput(options || {}))).then(returnOutputFilePath(objs))
  );
};

module.exports.install = function install(dirToScaffoldTo, scaffoldOptions, options) {
  const pkgJsonPath = path.join(dirToScaffoldTo, 'package.json');
  return readJson(pkgJsonPath).then(pkgJson => ({
    dependencies: pkgJson.dependencies,
    devDependencies: pkgJson.devDependencies,
    cmd: options.yarn ? 'yarn' : 'npm',
    args: ['install'],
  }));
};
