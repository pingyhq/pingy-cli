'use strict';

const ora = require('ora');
const inquirer = require('inquirer');
const pathTree = require('tree-from-paths');
const initLib = require('@pingy/init');
const scaffoldLib = require('@pingy/scaffold-primitive');
const confirmWithHelpText = require('./promptConfirmWithHelpText');

inquirer.registerPrompt('confirmWithHelpText', confirmWithHelpText);

const toNodeTree = (baseDir, paths) =>
  pathTree
    .render(paths, baseDir, (parent, file) => file)
    .substring(1)
    .split('\n')
    .join('\n  ');

const cwdNodeTree = info => toNodeTree(process.cwd(), info.preparedFiles);

const scaffoldConfirm = filesToWriteTxt =>
  inquirer.prompt([
    {
      type: 'confirmWithHelpText',
      name: 'doScaffold',
      // TODO: If any existing files exist then put up a red warning.
      message: 'Do you want Pingy to scaffold the following files for you?',
      default: true,
      helpText: `${filesToWriteTxt}`,
    }
  ]);

const whitespaceConfirm = () =>
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'whitespace',
        message: 'The most important question: Tabs or spaces',
        default: global.conf.get('lastInit.whitespace'),
        choices: [
          {
            name: '2 spaces',
            value: '2',
          },
          {
            name: '4 spaces',
            value: '4',
          },
          {
            name: 'Tabs',
            value: 'tabs',
          }
        ],
      }
    ])
    .then(({ whitespace }) => ({
      whitespace,
      doScaffold: true,
    }));

const performScaffold = (lastWhitespace, params) => ({ whitespace, doScaffold }) => {
  if (!doScaffold) return null;
  const { scaffoldOptions, url, isCustomScaffold } = params;
  let whitespaceVal = whitespace;
  if (lastWhitespace) {
    whitespaceVal = global.conf.get('lastInit.whitespace');
  }
  global.conf.set('lastInit.whitespace', whitespaceVal);
  if (isCustomScaffold) {
    return scaffoldLib.scaffold(
      url,
      process.cwd(),
      Object.assign(scaffoldOptions, {
        whitespace: whitespaceVal,
      })
    );
  }
  return initLib.scaffold(
    process.cwd(),
    Object.assign(scaffoldOptions, {
      whitespace: whitespaceVal,
    })
  );
};

const shouldAskWhitespace = whitespace => ({ doScaffold }) =>
  doScaffold && !whitespace ? whitespaceConfirm() : { whitespace, doScaffold };

function init(params) {
  const { scaffoldOptions, url, isCustomScaffold } = params;
  const lastWhitespace = global.repeatLastInit && global.conf.get('lastInit.whitespace');

  const preflight = isCustomScaffold
    ? scaffoldLib.preflight(url, process.cwd(), scaffoldOptions)
    : initLib.preflight(process.cwd(), scaffoldOptions);

  return preflight
    .then(cwdNodeTree)
    .then(scaffoldConfirm)
    .then(shouldAskWhitespace(lastWhitespace))
    .then(performScaffold(lastWhitespace, params))
    .then(() => ora().succeed('Site files scaffolded'));
}

module.exports.init = scaffoldOptions =>
  init({
    scaffoldOptions,
  });

module.exports.scaffold = (scaffoldOptions, url) =>
  init({ scaffoldOptions, url, isCustomScaffold: true });
