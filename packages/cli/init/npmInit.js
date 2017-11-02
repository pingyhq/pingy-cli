'use strict';

const ora = require('ora');
const spawn = require('child_process').spawn;
const { npmInit } = require('@pingy/scaffold-primitive');

function npmInitCLI() {
  const spinner = ora('Creating package.json').start();
  return npmInit(process.cwd()).then((initCmd) => {
    if (!initCmd) {
      spinner.succeed('package.json already exists');
      return null;
    }

    const spawnCmd = spawn(initCmd.cmd, initCmd.args, { stdio: ['pipe', 'pipe', process.stdout] });
    return new Promise((resolve, reject) => {
      spawnCmd.on('exit', (code) => {
        if (code === 0) {
          spinner.succeed('Created package.json');
          resolve(code);
        } else {
          spinner.fail('Failed to create package.json');
          reject(new Error(`npm init failed with code: ${code}`));
        }
      });
    });
  });
}

module.exports = npmInitCLI;
