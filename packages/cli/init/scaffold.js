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
  const htmlExtension = depsObj.html.extension || 'html';
  const jsExtension = depsObj.js.extension || 'js';
  const cssExtension = depsObj.css.extension || 'css';

  const filesToWrite = [
    `index.${htmlExtension}`,
    `scripts/main.${jsExtension}`,
    `styles/main.${cssExtension}`
  ];

  const filesToWriteTxt = archy(toNodeTree(filesToWrite)).split('\n').join('\n  ');

  return inquirer
    .prompt([
      {
        type: 'confirmWithHelpText',
        name: 'doScaffold',
        // TODO: If any existing files exist then put up a red warning.
        message: 'Do you want Pingy to scaffold the following files for you?',
        default: true,
        helpText: `${filesToWriteTxt}`,
      }
    ])
    .then(({ doScaffold }) =>
      doScaffold && inquirer
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
        .then(({ whitespace }) => {
          // TODO: Support babel.js and buble.js
          return scaffoldLib(process.cwd(), {
            html: { type: htmlExtension },
            styles: { type: cssExtension },
            scripts: { type: jsExtension },
            whitespaceFormatting: whitespace,
          });
        })
        .then(() => ora().succeed('Site files scaffolded'))
    );
}

module.exports = scaffold;
