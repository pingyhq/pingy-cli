'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const path = require('upath');
const pingyInit = require('@pingy/init');
const compilerMap = require('./compilerMap');
const updatePkgScripts = require('./updatePkgScripts');
const installDeps = require('./installDeps');
const npmInit = require('./npmInit');
const scaffold = require('./scaffold');
const renderLastInit = require('./renderLastInit');

const pkgJsonPath = path.join(process.cwd(), 'package.json');
const dotPingyJsonPath = path.join(process.cwd(), '.pingy.json');
const pingyJsonPath = path.join(process.cwd(), 'pingy.json');
const pkgJsonExists = fs.existsSync(pkgJsonPath);
const pingyJsonExists = fs.existsSync(pingyJsonPath) || fs.existsSync(dotPingyJsonPath);

const requiredLastInitProps = ['html', 'scripts', 'styles'];
const createChoices = type => [type, ...compilerMap[type].map(x => x.name)];

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
  }
];

function performActions(answers, options) {
  const scaffoldOptions = pingyInit.transformOptions(answers, options);

  updatePkgScripts();
  return scaffold(scaffoldOptions).then(() => installDeps(scaffoldOptions, options));
}

function processAnswers(options) {
  return (answers) => {
    global.conf.set('lastInit', answers);

    npmInit()
      .then(() => performActions(answers, options))
      .catch(e => ora().fail(e.stack));
  };
}

function prompt(options) {
  const hasLastInit = !requiredLastInitProps.some(prop => !global.conf.has(`lastInit.${prop}`));
  const lastInit = hasLastInit ? global.conf.get('lastInit') : null;
  return new Promise((resolve) => {
    if (pingyJsonExists && pkgJsonExists) {
      return inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'resume',
            default: false,
            message:
              'Looks like you have run `pingy init` already. Pingy has detected a pingy.json and package.json in your project, do you want to continue anyway?',
          }
        ])
        .then(answers => resolve(answers.resume));
    }
    return resolve(true);
  })
    .then((resume) => {
      if (!resume || !lastInit || options.ask) return resume;
      return inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'repeatLastInit',
            default: true,
            message: `Do you want to initialize your project using the same settings as last time?\n${renderLastInit(
              lastInit
            )}`,
          }
        ])
        .then((answers) => {
          if (answers.repeatLastInit) {
            global.repeatLastInit = true;
          }
          return resume;
        });
    })
    .then((resume) => {
      if (global.repeatLastInit) return processAnswers(options)(lastInit);
      if (resume) return inquirer.prompt(stage1).then(processAnswers(options));
      return null;
    });
}

function init(options) {
  return prompt(options);
}

module.exports = init;
