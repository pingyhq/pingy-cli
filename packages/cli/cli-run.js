#!/usr/bin/env node

'use strict';

const program = require('commander');
const fs = require('fs');
const path = require('upath');
const getPort = require('get-port');
const ora = require('ora');
const opn = require('opn');
const { inspect } = require('util');
const colors = require('colors/safe');
const chalk = require('chalk');
const pkgJson = require('./package');
const pingy = require('./pingy');
const init = require('./init');
const { getPingyJson, setPingyJson } = require('./pingyJson');
const Configstore = require('configstore');

const conf = new Configstore(pkgJson.name, {});
if (isNaN(conf.get('version'))) conf.delete('lastInit');
// Version config so we can easily invalidate it
conf.set('version', 2);
conf.set('cliVersion', pkgJson.version);
global.conf = conf;

const pingyAscii = fs.readFileSync(require.resolve('./pingy-ascii.txt'), 'utf8');

function run() {
  try {
    console.log(colors.rainbow(pingyAscii));
  } catch (err) {
    console.log(colors.red(`logo ${err}`));
  }

  program.version(pkgJson.version);

  program
    .command('init')
    .description('Initialise a new or existing website using Pingy')
    .option('--yarn', 'Use Yarn instead of NPM for installing packages')
    .option(
      '--global-pingy',
      "Don't install local version of Pingy CLI, use global version instead"
    )
    .option('--ask', "Ask for all init options (don't prompt to use existing init options)")
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
      init(options);
    });

  program
    .command('dev')
    .description('Serve local development version of website')
    .option('-p, --port [port]', 'Use chosen port (otherwise random port will be used)')
    .option('-q, --no-open', "Don't automatically launch site in web browser")
    .action((options) => {
      const pingyJson = getPingyJson();
      if (!pingyJson) return;
      const jsonPort = pingyJson.json.port;
      const customPort = Number(options.port || jsonPort);
      const port = customPort || null;
      getPort(port).then((freePort) => {
        if (typeof port === 'number' && port !== freePort) {
          console.log(
            chalk.red.bold(`Port ${port} is not available, using random port ${freePort} instead\n`)
          );
        }
        const serveOptions = { port: freePort };
        const { url } = pingy.serveSite(
          pingyJson.dir,
          Object.assign({}, pingyJson.json, serveOptions)
        );
        console.log(`Serving at ${url}`);
        if (options.open) opn(url);
        if (jsonPort !== freePort) setPingyJson(serveOptions);
      });
    });

  program
    .command('export')
    .description('Export website to a folder for distribution')
    .action(() => {
      const pingyJson = getPingyJson();
      if (!pingyJson) return;
      const inputDir = pingyJson.dir;
      const outputDir = path.join(inputDir, pingyJson.json.exportDir);

      const exportingSpinner = ora(`Exporting to ${chalk.bold(outputDir)}`).start();
      const exporting = pingy.exportSite(inputDir, outputDir, pingyJson.json);

      const spinners = {};
      let currentFile = null;

      exporting.then(
        () => {
          exportingSpinner.succeed();
          setTimeout(() => {
            process.exit(0);
          }, 10);
        },
        (err) => {
          if (currentFile) spinners[currentFile].fail();
          console.log(inspect(err));
          exportingSpinner.fail(`Failed export to ${chalk.bold(outputDir)}`);
          setTimeout(() => {
            process.exit(1);
          }, 10);
        }
      );

      exporting.events.on('compile-start', (file) => {
        spinners[file.path] = ora(`Compiling ${file.name}`).start();
        currentFile = file.path;
      });
      exporting.events.on('compile-done', (file) => {
        spinners[file.path].succeed();
        currentFile = null;
      });
    });

  if (!process.argv.slice(2).length) program.outputHelp();

  program.parse(process.argv);
}

module.exports = {
  run,
};
