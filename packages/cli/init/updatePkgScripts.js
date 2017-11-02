'use strict';

const ora = require('ora');
const { addPkgScripts, addPingyJson } = require('@pingy/scaffold-primitive');

function createDotPingy() {
  const spinner = ora('Creating pingy.json').start();
  return addPingyJson(process.cwd()).then(
    () => {
      spinner.succeed('Created pingy.json');
    },
    (err) => {
      spinner.fail(err.stack);
    }
  );
}

function updatePkgScripts() {
  const spinner = ora('Adding pingy scripts to package.json').start();
  return addPkgScripts(process.cwd()).then(
    () => {
      spinner.succeed('Pingy scripts added to package.json');
      return createDotPingy();
    },
    (err) => {
      spinner.fail(err.stack);
    }
  );
}

module.exports = updatePkgScripts;
