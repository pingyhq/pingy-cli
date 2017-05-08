'use strict';

const spawn = require('child_process').spawn;

function npmInit(quietMode) {
  return new Promise((resolve, reject) => {
    const npmCmd = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
    const subcommand = ['init'];
    if (quietMode) subcommand.push('--quiet');
    const cmd = spawn(npmCmd, subcommand, { stdio: 'inherit' });
    cmd.on('exit', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`npm init failed with code: ${code}`));
      }
    });
  });
}

module.exports = npmInit;
