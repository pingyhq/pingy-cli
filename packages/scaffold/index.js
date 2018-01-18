'use strict';

const { pathExists, readJson } = require('fs-extra');
const { join, normalize, resolve } = require('upath');
const mkdirpCB = require('mkdirp');
const { homedir } = require('os');
const util = require('util');
const npmiCB = require('npmi');

require('util.promisify').shim();

const npmi = util.promisify(npmiCB);
const mkdirp = util.promisify(mkdirpCB);

const cacheDir = join(homedir(), '.pingy', 'scaffolds');
const scaffoldFileName = 'pingy-scaffold.json';
const pkgFileName = 'package.json';

const isAlias = url => url.split('/').length === 1;

function identifyUrlType(url) {
  const scaffoldJsonPath = join(url, scaffoldFileName);
  return pathExists(scaffoldJsonPath).then(exists => {
    if (exists) {
      return {
        type: 'fs',
        url,
        shouldCache: false,
      };
    } else if (isAlias(url)) {
      return {
        type: 'npm',
        url: `pingy-scaffold-${url}`,
      };
    }
    return {
      type: 'npm',
      url,
    };
  });
}

function scaffoldFs(rawScaffoldPath) {
  const scaffoldPath = resolve(__dirname, rawScaffoldPath);
  // console.log(1112121212, __dirname, scaffoldPath);
  return pathExists(scaffoldPath).then(dirExists => {
    if (!dirExists) {
      throw new Error(`Folder '${scaffoldPath}' does not exist on filesystem`);
    }
    const scaffoldJsonPath = join(scaffoldPath, scaffoldFileName);
    const pkgJsonPath = join(scaffoldPath, pkgFileName);
    return pathExists(scaffoldJsonPath).then(scaffoldExists => {
      if (!scaffoldExists) {
        throw new Error(`Scaffold doesn't contain a ${scaffoldFileName} file`);
      }
      return readJson(scaffoldJsonPath).then(json => {
        if (!json.name || !json.description) {
          return readJson(pkgJsonPath).then(pkgJson => {
            const { name, description } = pkgJson;
            if (!name || !description) {
              throw new Error(
                `${scaffoldFileName} or ${pkgFileName} should contain a name and a description`
              );
            }
            return {
              scaffoldPath,
              json: Object.assign({}, json, {
                name: name.replace('pingy-scaffold-', ''),
                description,
              }),
            };
          });
        }
        return {
          scaffoldPath,
          json,
        };
      });
    });
  });
}

function scaffoldNPM(name) {
  const options = {
    name,
    path: cacheDir,
    forceInstall: true,
    npmLoad: {
      loglevel: 'silent',
    },
  };
  return mkdirp(cacheDir).then(() =>
    npmi(options)
      .then(res => {
        const pkg = res[res.length - 1];
        const url = pkg[1];
        return url;
      })
      .then(url => scaffoldFs(url))
  );
}

module.exports.cacheDir = cacheDir;

module.exports.identifyUrlType = identifyUrlType;

module.exports.fs = scaffoldFs;

module.exports.npm = scaffoldNPM;
