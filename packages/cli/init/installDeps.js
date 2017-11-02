'use strict';

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const spawn = require('child_process').spawn;
const { installDev } = require('@pingy/scaffold-primitive');

function installDeps(scaffoldOptions, options) {
  return installDev(scaffoldOptions, options).then((install) => {
    if (!install) {
      console.log(`\nNo dependencies needed. ${chalk.green('Done!')}`);
      return;
    }
    const { cmd, args } = install;
    console.log('\nReady to install dependencies.');
    console.log('\nCommand that will now be run:');

    const cmdText = `${cmd} ${args.join(' ')}`;
    console.log(`  > ${chalk.bold.underline(cmdText)}\n`);

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
          const installCmd = spawn(cmd, args, {
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
  });
}

module.exports = installDeps;
