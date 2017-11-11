'use strict';

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const spawn = require('cross-spawn');
const { install } = require('@pingy/scaffold-primitive');

const printDeps = (depType, deps) => {
  const lines = [];
  const depKeys = Object.keys(deps);
  if (depKeys.length === 0) return lines;
  lines.push(depType);
  depKeys.forEach((dep) => {
    const version = deps[dep];
    lines.push(` - ${chalk.bold(dep)} ${version && chalk.reset(`@ ${version}`)}`);
  });
  lines.push('');
  return lines;
};

const confirmInstall = (cmdObj) => {
  const { dependencies, devDependencies, cmd, args } = cmdObj;
  const lines = [];
  lines.push('Ready to install...\n');
  lines.push(...printDeps('Dependencies', dependencies));
  lines.push(...printDeps('Dev Dependencies', devDependencies));
  const cmdText = `${cmd} ${args.join(' ')}`;

  return inquirer
    .prompt([
      {
        type: 'confirm',
        name: 'doDepInstall',
        message: `${chalk.reset(lines.join('\n'))}\nRun ${chalk.underline(cmdText)} now?`,
        default: true,
      }
    ])
    .then(
      ({ doDepInstall }) =>
        new Promise((resolve) => {
          if (doDepInstall) {
            const spinner = ora('Installing').start();
            const installCmd = spawn(cmd, [...args, '--color=always']);
            const ios = ['stdout', 'stdin', 'stderr'];
            let spinnerStopped = false;
            const stopSpinner = () => {
              if (!spinnerStopped) {
                spinner.stop();
                spinnerStopped = true;
              }
            };
            ios.forEach((io) => {
              installCmd[io].on('data', () => stopSpinner());
              installCmd[io].pipe(process[io]);
            });

            installCmd.on('error', (err) => {
              console.log(`\n${err.stack}\n`);
              spinner.fail(
                `Error running ${chalk.bold.underline(
                  cmdText
                )}, perhaps try running the command manually instead`
              );
            });
            installCmd.on('exit', (code) => {
              if (code === 0) spinner.succeed('Installed');
              else {
                spinner.fail(
                  `Error code ${code} while running ${chalk.bold.underline(
                    cmdText
                  )}, perhaps try running the command manually instead`
                );
              }
              resolve();
            });
          } else {
            console.log(
              `OK, you should run the ${chalk.bold.underline('underlined')} command above manually.`
            );
            resolve();
          }
        })
    );
};

function installDeps(scaffoldOptions, options) {
  return install(process.cwd(), scaffoldOptions, options).then(confirmInstall);
}

module.exports = installDeps;
