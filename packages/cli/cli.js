#!/usr/bin/env node

'use strict';

const semver = require('semver');
const path = require('path');

const cliRunName = './cli-run';
const pkgName = './package';
const localCliPath = path.join(process.cwd(), 'node_modules', '@pingy', 'cli');

const run = (type) => {
  try {
    const cliPath = type === 'local' ? localCliPath : null;
    /* eslint-disable global-require, import/no-dynamic-require */
    const cli = require(cliPath ? path.join(cliPath, cliRunName) : cliRunName);
    const pkg = require(cliPath ? path.join(cliPath, pkgName) : pkgName);
    /* eslint-enable global-require, import/no-dynamic-require */
    console.log(`${pkg.version} (${type})`);
    cli.run();
  } catch (err) {
    if (semver.lte(process.version, '6.0.0') && err.name === 'SyntaxError') {
      console.log(
        `Pingy CLI is compatible with Node v6+. You are running ${process.version}. Please upgrade Node.`
      );
    } else {
      throw err;
    }
  }
};

try {
  // Try and run local version of Pingy CLI
  run('local');
} catch (e) {
  // Fallback to global
  run('global');
}
