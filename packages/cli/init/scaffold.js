'use strict';

const ora = require('ora');
const inquirer = require('inquirer');
const pathTree = require('tree-from-paths');
const initLib = require('@pingy/init');
const confirmWithHelpText = require('./promptConfirmWithHelpText');

inquirer.registerPrompt('confirmWithHelpText', confirmWithHelpText);

const toNodeTree = (baseDir, paths) =>
  pathTree
    .render(paths, baseDir, (parent, file) => file)
    .substring(1)
    .split('\n')
    .join('\n  ');

function scaffold(scaffoldOptions) {
  const lastWhitespace = global.repeatLastInit && global.conf.get('lastInit.whitespace');

  return initLib
    .preflight(process.cwd(), scaffoldOptions)
    .then(info => toNodeTree(process.cwd(), info.preparedFiles))
    .then(filesToWriteTxt =>
      inquirer.prompt([
        {
          type: 'confirmWithHelpText',
          name: 'doScaffold',
          // TODO: If any existing files exist then put up a red warning.
          message: 'Do you want Pingy to scaffold the following files for you?',
          default: true,
          helpText: `${filesToWriteTxt}`,
        }
      ])
    )
    .then(
      ({ doScaffold }) =>
        doScaffold &&
        !lastWhitespace &&
        inquirer.prompt([
          {
            type: 'list',
            name: 'whitespace',
            message: 'The most important question: Tabs or spaces',
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
    )
    .then(({ whitespace }) => {
      let whitespaceVal = whitespace;
      if (lastWhitespace) {
        whitespaceVal = global.conf.get('lastInit.whitespace');
      }
      global.conf.set('lastInit.whitespace', whitespaceVal);
      return initLib.scaffold(
        process.cwd(),
        Object.assign(scaffoldOptions, {
          whitespace: whitespaceVal,
        })
      );
    })
    .then(() => ora().succeed('Site files scaffolded'));
}

module.exports = scaffold;
