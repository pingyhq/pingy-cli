'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const validFilename = require('valid-filename');
const spawn = require('child_process').spawn;
const compilerMap = require('./compilerMap');
const dotPingyTmpl = require('./dotPingyTmpl');

const createChoices = (type) => [
  type,
  ...compilerMap[type].map(x => x.name)
]

const nameToModule = (type, prettyName) =>
    (compilerMap[type].find(x => x.name === prettyName) || {}).module;

const stage1 = [
  {
    type: 'list',
    name: 'html',
    message: 'What document format do you wish to use',
    choices: createChoices('HTML'),
  }, {
    type: 'list',
    name: 'styles',
    message: 'What styles format do you wish to use',
    choices: createChoices('CSS'),
  }, {
    type: 'list',
    name: 'scripts',
    message: 'What scripts format do you wish to use',
    choices: createChoices('JS'),
  }, {
    type: 'input',
    name: 'exportDir',
    message: 'Choose the folder name to export compiled files to',
    default: 'dist',
    validate: (input) => {
      if (!validFilename(input)) return 'Invalid folder name';
      return true;
    }
  },
];



function prepare() {
  inquirer.prompt(stage1).then((answers) => {
    const modules = {
      html: nameToModule('HTML', answers.html),
      css: nameToModule('CSS', answers.styles),
      js: nameToModule('JS', answers.scripts),
    }
    // TODO: add '@pingy/cli' below
    const deps = [modules.html, modules.css, modules.js].filter(x => !!x);

    const pkgJsonPath = path.join(process.cwd(), 'package.json')
    const pkgJsonExists = fs.existsSync(pkgJsonPath);

    if (!pkgJsonExists) {
      const npmInit = spawn('npm', ['init'], { stdio: 'inherit' });
      npmInit.on('exit', (code) => {
        if (code === 0) {
          updatePkgScripts(pkgJsonPath, answers);
          installDeps(deps);
        }
        else ora().fail(`npm init failed with code: ${code}`);
      });
    } else {
      updatePkgScripts(pkgJsonPath, answers);
      installDeps(deps)
    }
  });
}

function installDeps(deps) {
  if (deps.length === 0) {
    console.log(`\nNo dependencies needed. ${chalk.green('Done!')}`);
    return;
  }
  console.log('\nReady to install dependencies.');
  console.log('\nCommand that will now be run:');
  console.log(
    '  > ' + chalk.bold.underline(`npm install --save-dev ${deps.join(' ')}\n`)
  );

  inquirer.prompt([{
    type: 'confirm',
    name: 'installDeps',
    message: 'Run this command now?',
    default: true
  }]).then(({ installDeps }) => {
    if (installDeps) {
      const npmInstall = spawn(
        'npm', ['install',  '--save-dev', ...deps],
        { stdio: 'inherit' }
      );
      npmInstall.on('exit', (code) => {
        if (code === 0) ora().succeed('Dependencies installed');
        else ora().fail(`Dependency install failed with code: ${code}`);
      });
    } else {
      console.log(
        `OK, you should run the ${chalk.bold.underline('underlined')} command above manually.`
      )
    }
  });
}

function updatePkgScripts(pkgJsonPath, answers) {
  const spinner = ora('Adding pingy scripts to package.json').start();
  try {
    const pkgJson = require(pkgJsonPath);
    pkgJson.scripts.start = 'pingy serve';
    pkgJson.scripts.export = 'pingy export';
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson));
    spinner.succeed(`Pingy scripts added to package.json`);
    createDotPingy(pkgJson.name, answers.exportDir);
  } catch(e) {
    spinner.fail(err);
    return;
  }
}

function createDotPingy(name) {
  const filename = '.pingy.json';
  const spinner = ora(`Creating ${filename}`).start();
  try {
    fs.writeFileSync(path.join(process.cwd(), filename), dotPingyTmpl(name), 'utf8');
  } catch(e) {
    spinner.fail(err);
    return;
  }
  spinner.succeed(`Created ${filename}`);
}

module.exports = () => prepare();
