'use strict';

const ora = require('ora');
const inquirer = require('inquirer');
const pathTree = require('tree-from-paths');
const scaffoldLib = require('@pingy/init');
const confirmWithHelpText = require('./promptConfirmWithHelpText');

inquirer.registerPrompt('confirmWithHelpText', confirmWithHelpText);

const toNodeTree = (baseDir, paths) =>
  pathTree
    .render(paths, baseDir, (parent, file) => file)
    .substring(1)
    .split('\n')
    .join('\n  ');

function scaffold(pkgJsonPath, depsObj) {
  const lastWhitespace = global.repeatLastInit && global.conf.get('lastInit.whitespace');
  const options = {
    html: { type: depsObj.html.extension || 'html' },
    styles: { type: depsObj.css.extension || 'css' },
    scripts: { type: depsObj.js.extension || 'js' },
  };

  return scaffoldLib
    .preflight(process.cwd(), options)
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
      let whitespaceFormatting = whitespace;
      if (lastWhitespace) {
        whitespaceFormatting = global.conf.get('lastInit.whitespace');
      }
      global.conf.set('lastInit.whitespace', whitespaceFormatting);
      // TODO: Support babel.js and buble.js
      return scaffoldLib(
        process.cwd(),
        Object.assign(options, {
          whitespaceFormatting,
        })
      );
    })
    .then(() => ora().succeed('Site files scaffolded'));
}

module.exports = scaffold;
