'use strict';

const ora = require('ora');
const { updatePkgJsonAndPingyJson } = require('@pingy/core');
const { version } = require('../package.json');

async function update(scaffoldOptions, options) {
  let pkgJsonSpinner;
  let pingyJsonSpinner;
  try {
    pkgJsonSpinner = ora('Updating package.json').start();
    const doPingyJson = await updatePkgJsonAndPingyJson(
      version,
      scaffoldOptions,
      options
    );
    pkgJsonSpinner.succeed('Updated package.json');
    pingyJsonSpinner = ora('Creating pingy.json').start();
    await doPingyJson();
    pingyJsonSpinner.succeed('Created pingy.json');
  } catch (err) {
    (pingyJsonSpinner || pkgJsonSpinner).fail(err.stack);
  }
}

module.exports = update;
