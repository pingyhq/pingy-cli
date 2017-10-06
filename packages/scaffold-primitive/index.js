'use strict';

const fs = require('fs-extra');
const mark = require('markup-js');
const detab = require('detab');
const path = require('path');
const isAbsolute = require('is-absolute');

const maybeTab = (str, options) =>
  typeof options.whitespace === 'number' || !isNaN(options.whitespace)
    ? detab(str, parseInt(options.whitespace, 10))
    : str;
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

function doCopy(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (!Array.isArray(options.copy)) return [];

  return Promise.all(
    options.copy.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(addInputString)
  ).then(objs =>
    Promise.all(objs.map(tabTemplateAndOutput(options || {}))).then(returnOutputFilePath(objs))
  );
}

function doTemplates(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (!Array.isArray(options.templates)) return [];

  return Promise.all(
    options.templates.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(addInputString)
  ).then(objs =>
    Promise.all(objs.map(tabTemplateAndOutput(options || {}))).then(returnOutputFilePath(objs))
  );
}

module.exports = function scaffoldPrimitive(dirToScaffoldFrom, dirToScaffoldTo, options) {
  if (typeof options !== 'object') return Promise.resolve([[], []]);
  return Promise.all([
    doCopy(dirToScaffoldFrom, dirToScaffoldTo, options),
    doTemplates(dirToScaffoldFrom, dirToScaffoldTo, options)
  ]).then(arr => [].concat(arr[0], arr[1]));
};

module.exports.preflight = function scaffoldPrimitivePreflight(
  dirToScaffoldFrom,
  dirToScaffoldTo,
  options
) {
  if (typeof options !== 'object') return Promise.resolve([[], []]);
  return Promise.all([
    Array.isArray(options.copy)
      ? options.copy.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(x => x.output)
      : [],
    Array.isArray(options.templates)
      ? options.templates.map(fixPaths(dirToScaffoldFrom, dirToScaffoldTo)).map(x => x.output)
      : []
  ]).then(arr => [].concat(arr[0], arr[1]));
};
