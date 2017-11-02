'use strict';

const fs = require('fs-extra');
const mark = require('markup-js');
const detab = require('detab');
const path = require('path');
const isAbsolute = require('is-absolute');

const isValidWhitespace = options =>
  typeof options.whitespace === 'number' || !isNaN(options.whitespace);
const maybeTab = (str, options) =>
  isValidWhitespace(options) ? detab(str, parseInt(options.whitespace, 10)) : str;
const maybeTemplate = x => (x.vars ? mark.up(x.inputString, x.vars) : x.inputString);
const relativeJoin = (a, b) => (isAbsolute(b) ? b : path.join(a, b));
const fixPaths = (dirToScaffoldFrom, dirToScaffoldTo) => x =>
  Object.assign({}, x, {
    input: relativeJoin(dirToScaffoldFrom, x.input),
    output: relativeJoin(dirToScaffoldTo, x.output),
  });
const addInputString = x =>
  fs.readFile(x.input, 'utf8').then(inputString => Object.assign({}, x, { inputString }));
const returnOutputFilePath = objs => () => objs.map(x => x.output);
const tabTemplateAndOutput = options => x =>
  fs.outputFile(x.output, maybeTab(maybeTemplate(x), options));

module.exports = {
  isValidWhitespace,
  maybeTab,
  maybeTemplate,
  relativeJoin,
  fixPaths,
  addInputString,
  returnOutputFilePath,
  tabTemplateAndOutput,
};
