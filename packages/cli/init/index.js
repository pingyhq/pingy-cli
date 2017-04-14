'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const validFilename = require('valid-filename');
const spawn = require('child_process').spawn;
const compilerMap = require('./compilerMap');
const updatePkgScripts = require('./updatePkgScripts');
const installDeps = require('./installDeps');

const createChoices = type => [type, ...compilerMap[type].map(x => x.name)];

const nameToModule = (type, prettyName) =>
  (compilerMap[type].find(x => x.name === prettyName) || {}).module;

const stage1 = [
  {
    type: 'list',
    name: 'html',
    message: 'Whats document format do you wish to use',
    choices: createChoices('HTML'),
  },
  {
    type: 'list',
    name: 'styles',
    message: 'What styles format do you wish to use',
    choices: createChoices('CSS'),
  },
  {
    type: 'list',
    name: 'scripts',
    message: 'What scripts format do you wish to use',
    choices: createChoices('JS'),
  },
  {
    type: 'input',
    name: 'exportDir',
    message: 'Choose the folder name to export compiled files to',
    default: 'dist',
    validate: (input) => {
      if (!validFilename(input)) return 'Invalid folder name';
      return true;
    },
  }
];

function prepare() {
  inquirer.prompt(stage1).then((answers) => {
    const modules = {
      html: nameToModule('HTML', answers.html),
      css: nameToModule('CSS', answers.styles),
      js: nameToModule('JS', answers.scripts),
    };

    const deps = ['@pingy/cli', modules.html, modules.css, modules.js].filter(x => !!x);

    const pkgJsonPath = path.join(process.cwd(), 'package.json');
    const pkgJsonExists = fs.existsSync(pkgJsonPath);

    if (!pkgJsonExists) {
      const npmInit = spawn('npm', ['init'], { stdio: 'inherit' });
      npmInit.on('exit', (code) => {
        if (code === 0) {
          updatePkgScripts(pkgJsonPath, answers);
          installDeps(deps);
        } else ora().fail(`npm init failed with code: ${code}`);
      });
    } else {
      updatePkgScripts(pkgJsonPath, answers);
      installDeps(deps);
    }
  });
}

module.exports = () => prepare();
