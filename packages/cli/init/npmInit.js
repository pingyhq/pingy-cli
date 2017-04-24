'use strict';

const spawn = require('child_process').spawn;

function npmInit(quietMode) {
  return new Promise((resolve, reject) => {
    const subcommand = ['init'];
    if (quietMode) subcommand.push('--quiet');
    const cmd = spawn('npm', subcommand, { stdio: 'inherit' });
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
