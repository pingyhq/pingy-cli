'use strict';

const chalk = require('chalk');
const util = require('util');
const inquirer = require('inquirer');

const Base = inquirer.prompt.prompts.list;
function Prompt(...args) {
  this.firstRender = false;
  Base.apply(this, args);
  this.firstRender = false;
}
util.inherits(Prompt, Base);

Prompt.prototype.getQuestion = function getQuestion() {
  let message = `${this.opt.prefix} ${chalk.bold(this.opt.message)}${this.opt.suffix}${chalk.reset(
    ' '
  )}`;

  if (this.opt.helpText && this.status !== 'answered') {
    message += `\n \n${this.opt.helpText}\n`;
  }

  // Append the default if available, and if question isn't answered
  // if (this.opt.default != null && this.status !== 'answered') {
  //   message += chalk.dim(`(${this.opt.default}) `);
  // }
  return message;
};

module.exports = Prompt;
