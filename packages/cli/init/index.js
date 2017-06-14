'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('path');
const validFilename = require('valid-filename');
const compilerMap = require('./compilerMap');
const updatePkgScripts = require('./updatePkgScripts');
const installDeps = require('./installDeps');
const npmInit = require('./npmInit');
const scaffold = require('./scaffold');

const pkgJsonPath = path.join(process.cwd(), 'package.json');
const pingyJsonPath = path.join(process.cwd(), '.pingy.json');
const pkgJsonExists = fs.existsSync(pkgJsonPath);
const pingyJsonExists = fs.existsSync(pingyJsonPath);

const createChoices = type => [type, ...compilerMap[type].map(x => x.name)];
const nameToObj = (type, prettyName) => compilerMap[type].find(x => x.name === prettyName) || {};

const stage1 = [
  {
    type: 'list',
    name: 'html',
    message: 'What document format do you wish to use',
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
    validate(input) {
      if (!validFilename(input)) return 'Invalid folder name';
      return true;
    },
  }
];

function performActions(pkgJsonPath, answers, depsObj, options) {
  updatePkgScripts(pkgJsonPath, answers);
  return scaffold(pkgJsonPath, depsObj).then(() => installDeps(depsObj, options));
}

function processAnswers(options) {
  return (answers, quietMode) => {
    const depsObj = {
      html: nameToObj('HTML', answers.html),
      css: nameToObj('CSS', answers.styles),
      js: nameToObj('JS', answers.scripts),
    };

    if (pkgJsonExists) {
      performActions(pkgJsonPath, answers, depsObj, options);
    } else {
      npmInit(quietMode)
        .then(() => performActions(pkgJsonPath, answers, depsObj, options))
        .catch(e => ora().fail(e.message));
    }
  };
}

function prompt(options) {
  return new Promise((resolve) => {
    if (pingyJsonExists && pkgJsonExists) {
      return inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'resume',
            default: false,
            message: 'Looks like you have run `pingy init` already. Pingy has detected a .pingy.json and package.json in your project, do you want to continue anyway?',
          }
        ])
        .then(answers => resolve(answers.resume));
    }
    return resolve(true);
  }).then((resume) => {
    if (resume) return inquirer.prompt(stage1).then(processAnswers(options));
  });
}

function init(options) {
  // if (args.length > 0) {
  //   return processAnswers(
  //     {
  //       html: args.html || 'HTML',
  //       scripts: args.scripts || 'JS',
  //       styles: args.styles || 'CSS',
  //     },
  //     true
  //   );
  // }
  return prompt(options);
}

module.exports = init;
