'use strict';

const ora = require('ora');
const { updatePkgJson, addPingyJson } = require('@pingy/scaffold-primitive');
const { version } = require('../package.json');

function createDotPingy(scaffoldOptions) {
  const spinner = ora('Creating pingy.json').start();
  return addPingyJson(process.cwd(), scaffoldOptions).then(
    () => {
      spinner.succeed('Created pingy.json');
    },
    (err) => {
      spinner.fail(err.stack);
    }
  );
}

function maybeAddPingyDep(scaffoldOptions, options) {
  const newScaffoldedOptions = Object.assign({}, scaffoldOptions);
  if (!options.globalPingy) {
    newScaffoldedOptions.devDependencies = Object.assign({}, scaffoldOptions.devDependencies, {
      '@pingy/cli': `^${version}`,
    });
  }
  return newScaffoldedOptions;
}

function update(scaffoldOptions, options) {
  const spinner = ora('Updating package.json').start();
  return updatePkgJson(process.cwd(), maybeAddPingyDep(scaffoldOptions, options)).then(
    () => {
      spinner.succeed('Updated package.json');
      return createDotPingy(scaffoldOptions);
    },
    (err) => {
      spinner.fail(err.stack);
    }
  );
}

module.exports = update;
