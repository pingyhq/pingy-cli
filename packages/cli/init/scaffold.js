'use strict';

const chalk = require('chalk');
const ora = require('ora');
const inquirer = require('inquirer');
const archy = require('archy');
const scaffoldLib = require('@pingy/scaffold');
const confirmWithHelpText = require('./promptConfirmWithHelpText');

inquirer.registerPrompt('confirmWithHelpText', confirmWithHelpText);

const toNodeTree = (paths) => {
  const rootPath = [];
  const scriptsPath = [];
  const stylesPath = [];

  paths.forEach((path) => {
    const [folder, file] = path.split('/');
    if (!file) rootPath.push(folder);
    else if (folder === 'scripts') scriptsPath.push(file);
    else if (folder === 'styles') stylesPath.push(file);
  });
  return {
    nodes: [
      ...rootPath,
      {
        label: 'scripts',
        nodes: scriptsPath,
      },
      {
        label: 'styles',
        nodes: stylesPath,
      }
    ],
  };
};

function scaffold(pkgJsonPath, depsObj) {
  const options = {
    html: { type: depsObj.html.extension || 'html' },
    styles: { type: depsObj.css.extension || 'css' },
    scripts: { type: depsObj.js.extension || 'js' },
  };

  return scaffoldLib
    .preflight(process.cwd(), options)
    .then(info => archy(toNodeTree(info.preparedFiles)).split('\n').join('\n  '))
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
        inquirer
          .prompt([
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
          .then(({ whitespace }) =>
            // TODO: Support babel.js and buble.js
            scaffoldLib(
              process.cwd(),
              Object.assign(options, {
                whitespaceFormatting: whitespace,
              })
            )
          )
          .then(() => ora().succeed('Site files scaffolded'))
    );
}

module.exports = scaffold;
