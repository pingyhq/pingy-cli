'use strict';

const chalk = require('chalk');
const compilerMap = require('@pingy/init/compilerMap');

const valToName = (type, ext) =>
  (compilerMap[type].find(x => x.extension === ext) || {}).name || ext.toUpperCase();

module.exports = (lastInit) => {
  const lines = [];
  if (lastInit.html) {
    lines.push(`    ${chalk.reset('Documents')}: ${chalk.bold(valToName('html', lastInit.html))}`);
  }
  if (lastInit.scripts) {
    lines.push(`    ${chalk.reset('Scripts')}: ${chalk.bold(valToName('css', lastInit.scripts))}`);
  }
  if (lastInit.styles) {
    lines.push(`    ${chalk.reset('Styles')}: ${chalk.bold(valToName('js', lastInit.styles))}`);
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
