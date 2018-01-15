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
const pathTree = require('tree-from-paths');
const { basename, extname } = require('path');
const pkgJson = require('./package');
const pingy = require('./pingy');
const init = require('./init');
const { getPingyJson, setPingyJson } = require('./pingyJson');
const Configstore = require('configstore');
const graphExport = require('@pingy/export/lib/graph');

const conf = new Configstore(pkgJson.name, {});
// `+` below will convert numeric string to number
if (!Number.isFinite(+conf.get('version'))) conf.delete('lastInit');

// Version config so we can easily invalidate it in future
conf.set('version', 2);
conf.set('cliVersion', pkgJson.version);
global.conf = conf;

const pingyAscii = fs.readFileSync(
  require.resolve('./pingy-ascii.txt'),
  'utf8'
);

function runLegacyExport(inputDir, outputDir, pingyJson) {
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
    err => {
      if (currentFile) spinners[currentFile].fail();
      console.log(inspect(err));
      exportingSpinner.fail(`Failed export to ${chalk.bold(outputDir)}`);
      setTimeout(() => {
        process.exit(1);
      }, 10);
    }
  );

  exporting.events.on('compile-start', file => {
    spinners[file.path] = ora(`Compiling ${file.name}`).start();
    currentFile = file.path;
  });
  exporting.events.on('compile-done', file => {
    spinners[file.path].succeed();
    currentFile = null;
  });
}

function runGraphExport(inputDir, outputDir, pingyJson) {
  const { graph, progress } = graphExport(
    inputDir,
    pingyJson.json.entries,
    outputDir
  );
  const spinner = ora('Preparing').start();
  progress.on('glob', () => {
    spinner.text = 'Globbing entries';
  });
  progress.on('graph', () => {
    spinner.text = 'Graphing files to export';
  });
  progress.on('compile', () => {
    spinner.text = 'Compiling files';
  });
  progress.on('minify', () => {
    spinner.text = 'Minifying files';
  });
  progress.on('sourceMaps', () => {
    spinner.text = 'Serializing Source Maps';
  });
  progress.on('write', () => {
    spinner.text = 'Writing files';
  });

  const fileObj = (paths, parent, file) =>
    paths.find(x => x.path === parent + file) || {};
  const renderLeaf = paths => (parent, file) => {
    const { sourceExtension, transforms } = fileObj(paths, parent, file);
    if (!(sourceExtension || transforms)) return file;
    const minifyTxt =
      transforms && transforms.includes('minify') ? chalk.green(' ⇊') : '';
    if (!sourceExtension) return file + minifyTxt;

    const ext = extname(file);
    const sourceExtensionTxt = sourceExtension
      ? ` (${chalk.red.strikethrough(sourceExtension)})`
      : '';
    return `${file.slice(0, ext.length * -1)}${chalk.green(
      ext
    )}${sourceExtensionTxt}${minifyTxt}`;
  };

  const toNodeTree = (baseDir, paths) =>
    `  ${basename(outputDir)}/${pathTree
      .render(paths.map(x => x.path), baseDir, renderLeaf(paths))
      .substring(1)
      .split('\n')
      .join('\n  ')}`;

  return graph.then(outputInfo => {
    const minifiedFiles = outputInfo.filter(
      file => !!(file.transforms && file.transforms.includes('minify'))
    ).length;
    const compiledFiles = outputInfo.filter(file => !!file.sourceExtension)
      .length;
    spinner.succeed(
      `Exported ${outputInfo.length} files to ${chalk.bold(outputDir)}`
    );

    console.log();
    console.log(
      `Compiled 1 file ${chalk.red.strikethrough('pug')} → ${chalk.green(
        'html'
      )}`
    );
    console.log(
      `Compiled 1 file ${chalk.red.strikethrough('scss')} → ${chalk.green(
        'css'
      )}`
    );
    console.log(`${chalk.green('⇊')} Minified ${minifiedFiles} files`);
    console.log();

    console.log(toNodeTree(inputDir, outputInfo));
  });
}

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
    .option(
      '--ask',
      "Ask for all init options (don't prompt to use existing init options)"
    )
    .action(options => {
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
        "    Alias: 'bootstrap' (View alias registry at: https://github.com/pingyhq/scaffolds)",
        "    Git URL: 'https://github.com/pingyhq/pingy-scaffold-bootstrap.git'",
        "    Shorthand GitHub URL: 'pingyhq/bootstrap'",
        "    Filesystem path: '/Users/dave/code/pingy-scaffolds/bootstrap'"
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
    .option(
      '-p, --port [port]',
      'Use chosen port (otherwise random port will be used)'
    )
    .option('-q, --no-open', "Don't automatically launch site in web browser")
    .action(options => {
      const pingyJson = getPingyJson();
      if (!pingyJson) return;
      const jsonPort = pingyJson.json.port;
      const customPort = Number(options.port || jsonPort);
      const port = customPort || null;
      getPort(port).then(freePort => {
        if (typeof port === 'number' && port !== freePort) {
          console.log(
            chalk.red.bold(
              `Port ${port} is not available, using random port ${freePort} instead\n`
            )
          );
        }
        const serveOptions = { port: freePort };
        const { url } = pingy.serveSite(
          pingyJson.dir,
          Object.assign({}, pingyJson.json, serveOptions)
        );
        console.log(`Serving at ${url}`);
        if (options.open) opn(url, { wait: false });
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
          chalk.red.bold(
            'Please add an "exportDir" property to your pingy.json file.'
          )
        );
        return;
      }
      const outputDir = path.join(inputDir, pingyJson.json.exportDir);

      if (pingyJson.json.entries) {
        runGraphExport(inputDir, outputDir, pingyJson);
      } else {
        runLegacyExport(inputDir, outputDir, pingyJson);
      }
    });

  if (!process.argv.slice(2).length) program.outputHelp();

  program.parse(process.argv);
}

module.exports = {
  run,
};
