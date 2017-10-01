'use strict';

const chalk = require('chalk');

module.exports = lastInit => `
    ${chalk.reset('Documents')}: ${chalk.bold(lastInit.html)}
    ${chalk.reset('Scripts')}: ${chalk.bold(lastInit.scripts)}
    ${chalk.reset('Styles')}: ${chalk.bold(lastInit.styles)}
    ${chalk.reset('Whitespace format')}: ${chalk.bold(
  lastInit.whitespace.length === 1 ? `${lastInit.whitespace} spaces` : 'Tabs'
)}
`;
