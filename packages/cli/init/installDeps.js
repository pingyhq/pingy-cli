'use strict';

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;

const toArray = maybeArr => (Array.isArray(maybeArr) ? [...maybeArr] : [maybeArr]);

function installDeps(depsObj) {
  const htmlModules = toArray(depsObj.html.module);
  const cssModules = toArray(depsObj.css.module);
  const jsModules = toArray(depsObj.js.module);

  const deps = ['@pingy/cli', ...htmlModules, ...cssModules, ...jsModules].filter(x => !!x);
  if (deps.length === 0) {
    console.log(`\nNo dependencies needed. ${chalk.green('Done!')}`);
    return;
  }
  console.log('\nReady to install dependencies.');
  console.log('\nCommand that will now be run:');
  console.log(`  > ${chalk.bold.underline(`npm install --save-dev ${deps.join(' ')}\n`)}`);

  inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'doDepInstall',
        message: 'Run this command now?',
        default: true,
      }
    ])
    .then(({ doDepInstall }) => {
      if (doDepInstall) {
        const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
        const npmInstall = spawn(npmCmd, ['install', '--save-dev', ...deps], {
          stdio: 'inherit',
        });
        npmInstall.on('exit', (code) => {
          if (code === 0) ora().succeed('Dependencies installed');
          else ora().fail(`Dependency install failed with code: ${code}`);
        });
      } else {
        console.log(
          `OK, you should run the ${chalk.bold.underline('underlined')} command above manually.`
        );
      }
    });
}

module.exports = installDeps;
