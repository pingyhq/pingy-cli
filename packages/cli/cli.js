#!/usr/bin/env node
'use strict';

const program = require('commander');
const logo = require('turbo-logo');
const path = require('path');
const getPort = require('get-port');
const ora = require('ora');
const chalk = require('chalk');
const pkgJson = require('./package');
const pingy = require('.');
const init = require('./init');
const getPingyJson = require('./getPingyJson');

logo('Pingy');
console.log('\n');

program
  .version(pkgJson.version)

program
  .command('serve')
  .description('Serve Pingy project')
  .action(() => {
    getPort().then(port => {
      if (!getPingyJson()) return;
      pingy.serveSite(process.cwd(), port);
      console.log(`Serving at http://localhost:${port}`);
    });
  });

program
  .command('export')
  .description('Export Pingy project to a folder for distribution')
  .action(() => {
    const pingyJson = getPingyJson();
    if (!pingyJson) return;
    const inputDir = process.cwd();
    const outputDir = path.join(process.cwd(), pingyJson.exportDir);

    const exclusions = [
      ...pingyJson.exclusions,
      {
        path: pingyJson.exportDir,
        action: 'exclude',
        type: 'dir'
      }
    ];

    const exportingSpinner = ora(
      `${pingyJson.name} exported to ${chalk.bold(outputDir)}`
    ).start();
    const exporting = pingy.exportSite(inputDir, outputDir, { exclusions });
    exporting.then((a, b) => {
      exportingSpinner.succeed();
    });
    const spinners = {}
    exporting.events.on('compile-start', (file) => {
      spinners[file.path] = ora(`Compiling ${file.name}`).start();
    });
    exporting.events.on('compile-done', (file) => {
      spinners[file.path].succeed();
    });
  });

program
  .command('init')
  .description('Initialise a new or existing Pingy project')
  .action(() => init());

if (!process.argv.slice(2).length) program.outputHelp();

program.parse(process.argv);
