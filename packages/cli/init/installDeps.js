'use strict';

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;

const toArray = maybeArr => (Array.isArray(maybeArr) ? [...maybeArr] : [maybeArr]);

function installDeps(depsObj, options) {
  const htmlModules = toArray(depsObj.html.module);
  const cssModules = toArray(depsObj.css.module);
  const jsModules = toArray(depsObj.js.module);

  const pingyDep = options.globalPingy ? [null] : ['@pingy/cli'];
  const deps = [...pingyDep, ...htmlModules, ...cssModules, ...jsModules].filter(x => !!x);
  if (deps.length === 0) {
    console.log(`\nNo dependencies needed. ${chalk.green('Done!')}`);
    return;
  }
  console.log('\nReady to install dependencies.');
  console.log('\nCommand that will now be run:');
  if (options.yarn) {
    console.log(`  > ${chalk.bold.underline(`yarn add --dev ${deps.join(' ')}\n`)}`);
  } else {
    console.log(`  > ${chalk.bold.underline(`npm install --save-dev ${deps.join(' ')}\n`)}`);
  }

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
        let packageCmd = options.yarn ? 'yarn' : 'npm';
        if (/^win/.test(process.platform)) packageCmd += '.cmd';
        const packageOptions = options.yarn ? ['add', '--dev'] : ['install', '--save-dev'];

        const installCmd = spawn(packageCmd, [...packageOptions, ...deps], {
          stdio: 'inherit',
        });
        installCmd.on('exit', (code) => {
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
