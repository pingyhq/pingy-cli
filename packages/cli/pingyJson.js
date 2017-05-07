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
      dir: path.dirname(jsonPath),
      path: jsonPath,
      json,
    };
  } catch (e) {
    console.log(chalk.red.bold(`Unable to read '${jsonPath}'`));
    console.log(chalk.red.bold(e));
  }
  return false;
}

function setPingyJson(obj) {
  const pingyJson = getPingyJson();
  if (!pingyJson) return;
  const newPingyJson = Object.assign({}, pingyJson.json, obj);
  fs.writeFileSync(pingyJson.path, JSON.stringify(newPingyJson, null, '\t'), 'utf8');
}

module.exports = {
  getPingyJson,
  setPingyJson,
};
