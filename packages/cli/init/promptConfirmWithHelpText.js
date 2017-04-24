'use strict';

const chalk = require('chalk');
const util = require('util');
const inquirer = require('inquirer');

const Base = inquirer.prompt.prompts.confirm;
function Prompt(...args) {
  Base.apply(this, args);
}
util.inherits(Prompt, Base);

Prompt.prototype.getQuestion = function getQuestion() {
  let message = `${chalk.green('?')} ${chalk.bold(this.opt.message)} `;
  if (this.opt.helpText && this.status !== 'answered') {
    message += `\n \n${this.opt.helpText}\n`;
  }

  // Append the default if available, and if question isn't answered
  if (this.opt.default != null && this.status !== 'answered') {
    message += chalk.dim(`(${this.opt.default}) `);
  }
  return message;
};

module.exports = Prompt;
