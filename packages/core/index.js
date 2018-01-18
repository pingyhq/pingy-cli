'use strict';

const path = require('upath');
const fs = require('fs');
const connect = require('connect');
const serveStatic = require('serve-static');
const instant = require('@pingy/instant');
const enableDestroy = require('server-destroy');
const autoprefixer = require('express-autoprefixer');
const scaffold = require('@pingy/scaffold-middleware');
const { updatePkgJson, addPingyJson } = require('@pingy/scaffold-primitive');
const express = require('express');
const getPort = require('get-port');
const findUp = require('find-up');

function serveSite(sitePath, options) {
  const newOptions = { ...options };
  // eslint-disable-next-line global-require
  const pingyMiddleware = require('@pingy/middleware');

  const server = connect();
  enableDestroy(server);

  const $instant = instant(sitePath);
  const $serveStatic = serveStatic(sitePath);
  const $pingy = pingyMiddleware(sitePath, newOptions);

  if (newOptions.autoprefix) {
    if (typeof newOptions.autoprefix === 'string') {
      newOptions.autoprefix = [newOptions.autoprefix];
    } else if (newOptions.autoprefix === true) {
      newOptions.autoprefix = 'last 2 versions';
    }
    server.use((req, res, next) => {
      const cleanUrl = req.url.split('?')[0];
      if (path.extname(cleanUrl) === '.css') {
        const filePath = path.join(sitePath, cleanUrl);
        if (fs.existsSync(filePath)) {
          // Only run autoprefixer if it's vanilla css otherwise @pingy/compile will run it
          return autoprefixer({
            browsers: newOptions.autoprefix,
            cascade: false,
          })(req, res, next);
        }
      }
      return next();
    });
  }
  server.use($instant);
  server.use($serveStatic);
  server.use($pingy);

  $pingy.events.on('fileChanged', $instant.reload);

  server.listen(options.port);
  const url = `http://localhost:${options.port}`;
  return {
    server,
    url,
    pingy: $pingy,
    instant: $instant,
  };
}

function serveScaffolder(scaffoldPath) {
  return getPort().then(freePort => {
    const app = express();

    const $serveStatic = serveStatic(scaffoldPath);

    app.use(scaffold.inject);
    app.use($serveStatic);
    let scaffoldComplete = new Promise(resolve => {
      app.use('/__pingy__', scaffold.api(resolve, scaffoldPath));
    });
    app.use('/__pingy__.js', scaffold.servePingyJs);

    let server = app.listen(freePort);
    enableDestroy(server);
    const scaffoldUrl = `http://localhost:${freePort}`;

    scaffoldComplete = scaffoldComplete.then(scaffoldJson => {
      server.destroy();
      server = null;
      return scaffoldJson;
    });

    return {
      scaffoldUrl,
      scaffoldComplete,
    };
  });
}

function exportSite(inputDir, outputDir, options) {
  // eslint-disable-next-line global-require
  return require('@pingy/export')(inputDir, outputDir, options);
}

function getPingyJson() {
  const jsonPath = findUp.sync(['pingy.json', '.pingy.json']);
  if (!jsonPath) {
    const name = 'File not found: pingy.json';
    const message = 'Please create pingy.json file or run `pingy init`';
    const err = new Error(message);
    err.name = name;
    throw err;
  }
  try {
    const dir = path.dirname(jsonPath);
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    global.babyTolkCompilerModulePath = json.globalModuleSearch
      ? null
      : path.join(dir, 'node_modules');

    return {
      dir,
      path: jsonPath,
      json,
    };
  } catch (err) {
    err.name = `Unable to read '${jsonPath}'`;
    throw err;
  }
}

function setPingyJson(obj) {
  const pingyJson = getPingyJson();
  if (!pingyJson) return;
  const newPingyJson = Object.assign({}, pingyJson.json, obj);
  fs.writeFileSync(
    pingyJson.path,
    JSON.stringify(newPingyJson, null, '\t'),
    'utf8'
  );
}

function createDotPingy(scaffoldOptions) {
  return addPingyJson(process.cwd(), scaffoldOptions);
}

function maybeAddPingyDep(cliVersion, scaffoldOptions, options) {
  const newScaffoldedOptions = Object.assign({}, scaffoldOptions);
  if (!options.globalPingy) {
    newScaffoldedOptions.devDependencies = Object.assign(
      {},
      scaffoldOptions.devDependencies,
      {
        '@pingy/cli': `^${cliVersion}`,
      }
    );
  }
  return newScaffoldedOptions;
}

function updatePkgJsonAndPingyJson(cliVersion, scaffoldOptions, options) {
  return updatePkgJson(
    process.cwd(),
    maybeAddPingyDep(cliVersion, scaffoldOptions, options)
  ).then(() => () => createDotPingy(scaffoldOptions));
}

module.exports = {
  serveSite,
  exportSite,
  serveScaffolder,
  getPingyJson,
  setPingyJson,
  updatePkgJsonAndPingyJson,
};
