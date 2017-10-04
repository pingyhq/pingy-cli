'use strict';

const chalk = require('chalk');

module.exports = (lastInit) => {
  const lines = [];
  if (lastInit.html) {
    lines.push(`    ${chalk.reset('Documents')}: ${chalk.bold(lastInit.html)}`);
  }
  if (lastInit.scripts) {
    lines.push(`    ${chalk.reset('Scripts')}: ${chalk.bold(lastInit.scripts)}`);
  }
  if (lastInit.styles) {
    lines.push(`    ${chalk.reset('Styles')}: ${chalk.bold(lastInit.styles)}`);
  }
  if (lastInit.whitespace) {
    lines.push(
      `    ${chalk.reset('Whitespace format')}: ${chalk.bold(
        lastInit.whitespace.length === 1 ? `${lastInit.whitespace} spaces` : 'Tabs'
      )}`
    );
  }
  return `${lines.join('\n')}\n`;
};
