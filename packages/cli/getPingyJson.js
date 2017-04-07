'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

function getPingyJson() {
  const pingyJsonPath = path.join(process.cwd(), '.pingy.json')
  const pingyJsonExists = fs.existsSync(pingyJsonPath);

  if (!pingyJsonExists) {
    console.log(chalk.red(
      `${chalk.bold('File not found')}: .pingy.json.\nPlease create it or run \`pingy init\`.`
    ));
    return false;
  }
  try {
    const pingyJson = JSON.parse(fs.readFileSync(pingyJsonPath, 'utf8'));
    return pingyJson;
  } catch(e) {
    console.log(chalk.red.bold(e));
    return false;
  }
  return false;
}

module.exports = getPingyJson;
