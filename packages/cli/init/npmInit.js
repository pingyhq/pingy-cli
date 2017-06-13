'use strict';

const ora = require('ora');
const spawn = require('child_process').spawn;

function npmInit(quietMode) {
  return new Promise((resolve, reject) => {
    const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const subcommand = ['init', '--yes'];
    if (quietMode) subcommand.push('--quiet');
    const spinner = ora('Creating package.json').start();
    const cmd = spawn(npmCmd, subcommand, { stdio: ['pipe', 'pipe', process.stdout] });
    cmd.on('exit', (code) => {
      if (code === 0) {
        spinner.succeed('Created package.json');
        resolve(code);
      } else {
        spinner.fail('Failed to create package.json');
        reject(new Error(`npm init failed with code: ${code}`));
      }
    });
  });
}

module.exports = npmInit;
