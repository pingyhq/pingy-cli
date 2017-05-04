'use strict';

const ora = require('ora');
const fs = require('fs');
const path = require('path');
const dotPingyTmpl = require('./dotPingyTmpl');

function createDotPingy(name) {
  const filename = '.pingy.json';
  const spinner = ora(`Creating ${filename}`).start();
  try {
    fs.writeFileSync(path.join(process.cwd(), filename), dotPingyTmpl(name), 'utf8');
  } catch (err) {
    spinner.fail(err);
    return;
  }
  spinner.succeed(`Created ${filename}`);
}

function updatePkgScripts(pkgJsonPath, answers) {
  const spinner = ora('Adding pingy scripts to package.json').start();
  try {
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
    pkgJson.scripts.start = 'pingy dev';
    pkgJson.scripts.export = 'pingy export';
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson));
    spinner.succeed('Pingy scripts added to package.json');
    createDotPingy(pkgJson.name, answers.exportDir);
  } catch (err) {
    spinner.fail(err);
  }
}

module.exports = updatePkgScripts;
