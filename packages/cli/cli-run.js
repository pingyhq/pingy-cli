#!/usr/bin/env node

'use strict';

const program = require('commander');
const logo = require('turbo-logo');
const path = require('path');
const getPort = require('get-port');
const ora = require('ora');
const chalk = require('chalk');
const opn = require('opn');
const pkgJson = require('./package');
const pingy = require('./pingy');
const init = require('./init');
const getPingyJson = require('./getPingyJson');

function run() {
  logo('Pingy');
  console.log('\n');

  program.version(pkgJson.version);

  program
    .command('init')
    .description('Initialise a new or existing website using Pingy')
    // .option('-q, --quiet', "Assume defaults and don't ask any questions. Non-interactive mode")
    // .option('--html', 'Language to use for HTML docs')
    // .option('--styles', 'Language to use for styles')
    // .option('--scripts', 'Language to use for scripts')
    // .option('--dist', 'Folder name to export distibution-ready site to')
    // .option('--no-scaffold', "Don't scaffold files for this site")
    // .option('--no-install', "Don't install project dependencies automatically")
    .action((options) => {
      // if (options.quiet) {
      //   TODO: Non-interactive more
      // }
      init();
    });

  program
    .command('dev')
    .description('Serve local development version of website')
    .option('-p, --port [port]', 'Use chosen port (otherwise random port will be used)')
    .option('-q, --no-open', "Don't automatically launch site in web browser")
    .action((options) => {
      const port = Number(options.port) || null;
      return getPort(port).then((freePort) => {
        const pingyJson = getPingyJson();
        if (!pingyJson) return;
        if (typeof port === 'number' && port !== freePort) {
          console.log(
            chalk.red.bold(`Port ${port} is not available, using random port ${freePort} instead\n`)
          );
        }
        const { url } = pingy.serveSite(pingyJson.path, freePort);
        console.log(`Serving at ${url}`);
        if (options.open) opn(url);
      });
    });

  program
    .command('export')
    .description('Export website to a folder for distribution')
    .action(() => {
      const pingyJson = getPingyJson();
      if (!pingyJson) return;
      const inputDir = pingyJson.path;
      const outputDir = path.join(inputDir, pingyJson.json.exportDir);

      const exclusions = [
        ...pingyJson.json.exclusions,
        {
          path: pingyJson.json.exportDir,
          action: 'exclude',
          type: 'dir',
        }
      ];

      const exportingSpinner = ora(
        `${pingyJson.json.name} exported to ${chalk.bold(outputDir)}`
      ).start();
      const exporting = pingy.exportSite(inputDir, outputDir, { exclusions });
      exporting.then(() => {
        exportingSpinner.succeed();
      });
      const spinners = {};
      exporting.events.on('compile-start', (file) => {
        spinners[file.path] = ora(`Compiling ${file.name}`).start();
      });
      exporting.events.on('compile-done', (file) => {
        spinners[file.path].succeed();
      });
    });

  if (!process.argv.slice(2).length) program.outputHelp();

  program.parse(process.argv);
}

module.exports = {
  run,
};
