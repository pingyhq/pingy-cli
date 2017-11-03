'use strict';

const {
  fixPaths,
  addInputString,
  returnOutputFilePath,
  tabTemplateAndOutput,
} = require('./helpers');
const dotPingyTmpl = require('./dotPingyTmpl');
const { writeFileSync, readFileSync, existsSync } = require('fs');
const path = require('path');
const checkdir = require('checkdir');

function doFiles(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (!Array.isArray(options.files)) return Promise.resolve([]);
  return Promise.all(
    options.files.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(addInputString)
  ).then(objs =>
    Promise.all(objs.map(tabTemplateAndOutput(options || {}))).then(returnOutputFilePath(objs))
  );
}

function doInstall(installType, scaffoldOptions, options) {
  return new Promise((resolve) => {
    const pkgs = scaffoldOptions[installType];
    if (!Array.isArray(pkgs)) return resolve(null);
    const isDev = installType === 'devDependencies';
    if (isDev && !options.globalPingy) pkgs.push('@pingy/cli');
    if (pkgs.length === 0) return resolve(null);

    let packageCmd = options.yarn ? 'yarn' : 'npm';
    if (/^win/.test(process.platform)) packageCmd += '.cmd';
    const packageOptions = [];
    if (options.yarn) {
      packageOptions.push('add');
      if (isDev) packageOptions.push('--dev');
    } else {
      // npm
      packageOptions.push('install');
      if (isDev) packageOptions.push('--save-dev');
      else packageOptions.push('--save');
    }
    return resolve({
      cmd: packageCmd,
      args: [...packageOptions, ...pkgs],
    });
  });
}

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
  return new Promise((resolve) => {
    const pkgJsonPath = path.join(dirToScaffoldTo, 'package.json');
    const pkgJsonExists = existsSync(pkgJsonPath);
    if (pkgJsonExists) return resolve(null);
    const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const subcommand = ['init', '--yes'];
    return resolve({
      cmd: npmCmd,
      args: subcommand,
    });
  });
};

module.exports.addPkgScripts = function addPkgScripts(dirToScaffoldTo) {
  return new Promise((resolve) => {
    const pkgJsonPath = path.join(dirToScaffoldTo, 'package.json');
    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
    if (!pkgJson.scripts) pkgJson.scripts = {};
    pkgJson.scripts.start = 'pingy dev';
    pkgJson.scripts.export = 'pingy export';
    writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, '\t'));
    return resolve(pkgJson);
  });
};

module.exports.addPingyJson = function addPingyJson(dirToScaffoldTo) {
  return new Promise((resolve) => {
    const filename = 'pingy.json';
    const pingyJson = dotPingyTmpl({
      name: path.basename(dirToScaffoldTo),
    });
    writeFileSync(path.join(dirToScaffoldTo, filename), JSON.stringify(pingyJson), 'utf8');
    return resolve(pingyJson);
  });
};

module.exports.scaffold = function scaffold(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (typeof options !== 'object') return Promise.resolve([]);
  return doFiles(dirToScaffoldFrom, dirToScaffoldTo, options);
};

module.exports.install = function install(scaffoldOptions, options) {
  return doInstall('dependencies', scaffoldOptions, options);
};

module.exports.installDev = function installDev(scaffoldOptions, options) {
  return doInstall('devDependencies', scaffoldOptions, options);
};
