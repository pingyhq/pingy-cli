'use strict';

const path = require('upath');
const checkDir = require('checkdir');

module.exports = function preflight(_inputDir, _outputDir) {
  const inputDir = path.normalize(_inputDir);
  const checks = [
    checkDir(inputDir),
    checkDir(path.join(inputDir, 'node_modules')),
    checkDir(path.join(inputDir, 'bower_components'))
  ];
  if (_outputDir) {
    const outputDir = path.normalize(_outputDir);
    checks.push(checkDir(outputDir));
  }
  return Promise.all(checks).then(info => {
    const mainDir = info[0];
    const nodeModules = info[1];
    const bowerComponents = info[2];
    const outputDir = info[3] || null;
    return Object.assign(
      {},
      mainDir,
      { nodeModules: nodeModules.exists },
      { bowerComponents: bowerComponents.exists },
      { outputDir }
    );
  });
};
