'use strict';

// const injector = require('connect-injector');
const express = require('express');
const injector = require('connect-injector');
const mark = require('markup-js');
const fs = require('fs-extra');
const path = require('path');

const script = '/__pingy__.js';

const isHTML = res =>
  res.getHeader('content-type') &&
  res.getHeader('content-type').indexOf('text/html') !== -1;

const isJS = res =>
  res.getHeader('content-type') &&
  res.getHeader('content-type').indexOf('javascript') !== -1;

const isCSS = res =>
  res.getHeader('content-type') &&
  res.getHeader('content-type').indexOf('text/css') !== -1;

const injectPingy = injector(
  (req, res) => isHTML(res),
  (data, req, res, callback) => {
    const body = data.toString();
    if (body.search(/<\/body>/i) !== -1) {
      return callback(
        null,
        body.replace(
          /<\/body>/i,
          `  <script src="${script}"></script>\n</body>`
        )
      );
    }
    return callback(null, `${body}  <script src="${script}"></script>`);
  }
);

const maybeTemplate = injector(
  (req, res) => {
    const hasQueryString = Object.keys(req.query).length;
    if (!hasQueryString) return false;
    return isHTML(res) || isJS(res) || isCSS(res);
  },
  (data, req, res, callback) => {
    const body = data.toString();
    const result = mark.up(body, req.query);
    return callback(null, result);
  }
);

function servePingyJs(req, res) {
  return res.sendFile('./client.js', { root: __dirname });
}

const isObj = x => typeof x === 'object';
const isArr = x => Array.isArray(x);

function mergeScaffolds(base, prime) {
  if (!isObj(base)) return prime;
  if (!isObj(prime)) return base;

  const pingyJson = Object.assign({}, base.pingyJson, prime.pingyJson);
  if (isObj(base.pingyJson) && isObj(prime.pingyJson)) {
    const baseEx = base.pingyJson.exclusions || [];
    const primeEx = prime.pingyJson.exclusions || [];
    const exclusions = baseEx.concat(primeEx);

    Object.assign(pingyJson, { exclusions });
  }

  const baseFiles = isArr(base.files) ? base.files : [];
  const primeFiles = isArr(prime.files) ? prime.files : [];
  const files = baseFiles.concat(primeFiles);

  return Object.assign({}, base, prime, {
    dependencies: Object.assign({}, base.dependencies, prime.dependencies),
    devDependencies: Object.assign(
      {},
      base.devDependencies,
      prime.devDependencies
    ),
    pingyJson,
    files,
  });
}

function pingyApi(resolve, scaffoldPath) {
  const scaffoldJsonPath = path.join(scaffoldPath, 'pingy-scaffold.json');
  const baseScaffold = fs.readJsonSync(scaffoldJsonPath, { throws: false });
  return (req, res) => {
    const body = req.body || {};
    const { scaffold } = body;
    if (!scaffold) res.send({});
    const mergedScaffold = mergeScaffolds(baseScaffold, scaffold);
    resolve(mergedScaffold);
    res.send(mergedScaffold);
  };
}

module.exports.inject = [injectPingy, maybeTemplate];
module.exports.api = (resolve, scaffoldPath) => [
  express.json(),
  pingyApi(resolve, scaffoldPath)
];
module.exports.servePingyJs = servePingyJs;
