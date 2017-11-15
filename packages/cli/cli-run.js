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
    .action((options) => {
      init(options);
    });

  program
    .command('scaffold <url>')
    .description(
      [
        'Scaffold a new website using a third-party project template',
        '',
        '  <url> can be:',
        '',
        '    Git URL: https://github.com/pingyhq/pingy-scaffold-bootstrap-jumbotron.git',
        '    Shorthand GitHub URL: pingyhq/bootstrap-jumbotron',
        '    Filesystem path: /Users/dave/code/pingy-scaffolds/bootstrap-jumbotron'
      ].join('\n')
    )
    .option('--yarn', 'Use Yarn instead of NPM for installing packages')
    .option(
      '--global-pingy',
      "Don't install local version of Pingy CLI, use global version instead"
    )
    .action((url, options) => {
      init.scaffold(url, options);
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
      if (!pingyJson.json.exportDir) {
        console.error(
          chalk.red.bold('Please add an "exportDir" property to your pingy.json file.')
        );
        return;
      }
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
