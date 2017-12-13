'use strict';

const fs = require('fs-extra');
const mark = require('markup-js');
const detab = require('detab');
const path = require('path');
const isAbsolute = require('is-absolute');
const promiseAllProps = require('promise-all-props');
const mapObj = require('map-obj');

const isValidWhitespace = options =>
  // `+` will convert numeric string to number
  Number.isInteger(+options.whitespace);
const maybeTab = (str, options) =>
  isValidWhitespace(options)
    ? detab(str, parseInt(options.whitespace, 10))
    : str;
const maybeTemplate = x =>
  x.vars ? mark.up(x.inputString, x.vars) : x.inputString;
const relativeJoin = (a, b) => (isAbsolute(b) ? b : path.join(a, b));
const fixPaths = (dirToScaffoldFrom, dirToScaffoldTo) => x =>
  Object.assign({}, x, {
    input: relativeJoin(dirToScaffoldFrom, x.input),
    includes: mapObj(x.includes || {}, (key, value) => [
      key,
      relativeJoin(dirToScaffoldFrom, value)
    ]),
    output: relativeJoin(dirToScaffoldTo, x.output),
  });
const isGitIgnore = x => path.basename(x) === '.gitignore';
const removeDotFromGitIgnore = x => x.replace('.gitignore', 'gitignore');
const addInputString = x =>
  fs
    .readFile(x.input, 'utf8')
    .catch(err => {
      if (isGitIgnore(x.input)) {
        return fs
          .readFile(removeDotFromGitIgnore(x.input), 'utf8')
          .catch(() => {
            throw new Error(
              [
                "npm doesn't allow .gitignore files.",
                'Rename the file to `gitignore` (without the dot)',
                'but still reference it as `.gitignore` in pingy-scaffold.json',
                'and Pingy will fix the filename while scaffolding.'
              ].join(' ')
            );
          });
      }
      throw err;
    })
    .then(inputString => Object.assign({}, x, { inputString }));
const readAllObj = x =>
  mapObj(x, (key, value) => [key, fs.readFile(value, 'utf8')]);
const resolveIncludesToVars = x =>
  x.includes
    ? promiseAllProps(readAllObj(x.includes)).then(includes =>
        Object.assign({}, x, {
          vars: Object.assign({}, x.vars, { includes }),
        })
      )
    : Promise.resolve(x);
const returnOutputFilePath = objs => () => objs.map(x => x.output);
const tabTemplateAndOutput = options => x =>
  resolveIncludesToVars(x).then(y =>
    fs.outputFile(y.output, maybeTab(maybeTemplate(y), options))
  );

module.exports = {
  isValidWhitespace,
  maybeTab,
  maybeTemplate,
  relativeJoin,
  fixPaths,
  addInputString,
  resolveIncludesToVars,
  returnOutputFilePath,
  tabTemplateAndOutput,
};
