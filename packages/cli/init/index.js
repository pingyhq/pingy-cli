'use strict';

const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs');
const chalk = require('chalk');
const path = require('upath');
const opn = require('opn');
const compilerMap = require('@pingy/init/compilerMap');
const scaffoldParse = require('@pingy/scaffold');
const initLib = require('@pingy/init');
const logSymbols = require('log-symbols');
const updatePkgScripts = require('./updatePkgScripts');
const installDeps = require('./installDeps');
const npmInit = require('./npmInit');
const scaffold = require('./scaffold');
const renderLastInit = require('./renderLastInit');
const pingy = require('../pingy');

const pkgJsonPath = path.join(process.cwd(), 'package.json');
const dotPingyJsonPath = path.join(process.cwd(), '.pingy.json');
const pingyJsonPath = path.join(process.cwd(), 'pingy.json');
const pkgJsonExists = fs.existsSync(pkgJsonPath);
const pingyJsonExists =
  fs.existsSync(pingyJsonPath) || fs.existsSync(dotPingyJsonPath);

const requiredLastInitProps = ['html', 'scripts', 'styles', 'whitespace'];
const createChoices = type =>
  compilerMap[type].map(x => ({
    name: x.name,
    value: x.extension,
  }));

const stage1 = [
  {
    type: 'list',
    name: 'html',
    message: 'What document format do you wish to use',
    choices: createChoices('docs'),
  },
  {
    type: 'list',
    name: 'styles',
    message: 'What styles format do you wish to use',
    choices: createChoices('styles'),
  },
  {
    type: 'list',
    name: 'scripts',
    message: 'What scripts format do you wish to use',
    choices: createChoices('scripts'),
  }
];

function performInitActions(answers, options) {
  const scaffoldOptions = initLib.transformOptions(
    Object.assign({}, answers, {
      html: {
        type: answers.html,
      },
      scripts: {
        type: answers.scripts,
      },
      styles: {
        type: answers.styles,
      },
    })
  );

  return scaffold
    .init(scaffoldOptions)
    .then(() => npmInit())
    .then(() => updatePkgScripts(scaffoldOptions, options))
    .then(() => installDeps(scaffoldOptions, options));
}

function performScaffoldActions(scaffoldOptions, options, url) {
  return scaffold
    .scaffold(scaffoldOptions, url)
    .then(() => npmInit())
    .then(() => updatePkgScripts(scaffoldOptions, options))
    .then(() => installDeps(scaffoldOptions, options))
    .catch(e => ora().fail(e.stack));
}

function processAnswers(options) {
  return answers => {
    global.conf.set('lastInit', answers);

    performInitActions(answers, options).catch(e => ora().fail(e.stack));
  };
}

function checkForExistingPingySite() {
  if (pingyJsonExists && pkgJsonExists) {
    console.log('Looks like you have already initialised Pingy here.');
    console.log(
      'Pingy has detected a pingy.json and package.json in your project.'
    );
    return inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'resume',
          default: false,
          message: 'Do you want to continue anyway?',
        }
      ])
      .then(answers => answers.resume);
  }
  return Promise.resolve(true);
}

function prompt(options) {
  const hasLastInit =
    requiredLastInitProps.filter(prop => global.conf.has(`lastInit.${prop}`))
      .length === requiredLastInitProps.length;
  const lastInit = hasLastInit ? global.conf.get('lastInit') : null;
  return checkForExistingPingySite()
    .then(resume => {
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
        .then(answers => {
          if (answers.repeatLastInit) {
            global.repeatLastInit = true;
          }
          return resume;
        });
    })
    .then(resume => {
      if (global.repeatLastInit) return processAnswers(options)(lastInit);
      if (resume) return inquirer.prompt(stage1).then(processAnswers(options));
      return null;
    });
}

function init(options) {
  return prompt(options);
}

function scaffoldCmd(unverifiedUrl, options) {
  return checkForExistingPingySite().then(resume => {
    if (!resume) return;

    scaffoldParse
      .identifyUrlType(unverifiedUrl)
      .then(urlObj => {
        const { type, url, fromCache } = urlObj;
        if (type === 'fs') {
          return scaffoldParse.fs(url);
        }
        if (type === 'git') {
          if (fromCache) {
            console.log(
              logSymbols.warning,
              'Scaffold request error, resolving from scaffold cache instead'
            );
          }

          const scaffoldSpinner = ora('Retrieving scaffold with git').start();
          return scaffoldParse.git(url).then(
            res => {
              scaffoldSpinner[res.fromCache ? 'info' : 'succeed'](
                `Retrieved scaffold ${
                  res.fromCache ? chalk.bold('from local cache') : 'with git'
                }`
              );
              return res;
            },
            err => {
              scaffoldSpinner.fail();
              throw err;
            }
          );
        }
        throw new Error('Unrecognized URL');
      })
      .then(res => {
        const { json, scaffoldPath } = res;
        const { name, description, web } = json;
        console.log();
        console.log(`Scaffolding ${chalk.bold(name)}`);
        console.log(description);
        console.log();
        if (!web) return performScaffoldActions(json, options, scaffoldPath);
        return pingy.serveScaffolder(scaffoldPath, options).then(x => {
          const { scaffoldComplete, scaffoldUrl } = x;
          const configureScaffold = ora(
            `Waiting for web scaffold to be configured at ${chalk.underline(
              scaffoldUrl
            )}`
          ).start();
          // { wait: false } because otherwise the process won't exit at the end
          opn(scaffoldUrl, { wait: false });
          return scaffoldComplete.then(mergedJson => {
            configureScaffold.succeed('Web scaffold configuration done');
            return performScaffoldActions(mergedJson, options, scaffoldPath);
          });
        });
      })
      .catch(err => console.log(chalk.red.bold(err)));
  });
}

module.exports = init;
module.exports.scaffold = scaffoldCmd;
