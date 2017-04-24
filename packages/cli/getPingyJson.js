'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const findUp = require('find-up');

function getPingyJson() {
  const jsonPath = findUp.sync(['.pingy.json', '.pingy']);

  if (!jsonPath) {
    console.log(
      chalk.red(
        `${chalk.bold('File not found')}: .pingy.json.\nPlease create it or run \`pingy init\`.`
      )
    );
    return false;
  }
  try {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return {
      path: path.dirname(jsonPath),
      json,
    };
  } catch (e) {
    console.log(chalk.red.bold(`Unable to read '${jsonPath}'`));
    console.log(chalk.red.bold(e));
  }
  return false;
}

module.exports = getPingyJson;
