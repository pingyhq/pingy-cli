'use strict';

const { pathExists, readJson } = require('fs-extra');
const { join } = require('upath');
const github = require('gh-got');
const isGitUrl = require('is-git-url');
const crypto = require('crypto');
const gitPullOrCloneCB = require('git-pull-or-clone');
const rimrafCB = require('rimraf');
const mkdirpCB = require('mkdirp');
const { homedir } = require('os');
const util = require('util');
const req = require('request-promise-native');

require('util.promisify').shim();

const gitPullOrClone = util.promisify(gitPullOrCloneCB);
const mkdirp = util.promisify(mkdirpCB);
const rimraf = util.promisify(rimrafCB);
const cacheDir = join(homedir(), '.pingy', 'scaffolds');
const scaffoldFileName = 'pingy-scaffold.json';

const shaDigest = string =>
  crypto
    .createHash('sha1')
    .update(string)
    .digest('hex');

const isGithubShortUrl = url => url.split('/').length === 2;
const isAlias = url => url.split('/').length === 1;

const handleGithubError = err => {
  if (err.statusCode === 404) return null;
  // TODO: handle 403 (API rate limit exceeded)
  throw err;
};

const invalidUrlError = () =>
  new Error('Not a valid Pingy scaffold url/path/alias.');
function identifyUrlType(url) {
  // TODO: Check Registry at https://pingyhq.github.io/scaffolds/scaffolds.json
  const scaffoldJsonPath = join(url, scaffoldFileName);
  return pathExists(scaffoldJsonPath).then(exists => {
    if (exists) {
      return {
        type: 'fs',
        url,
      };
    } else if (isAlias(url)) {
      return req('https://pingyhq.github.io/scaffolds/scaffolds.json')
        .then(str => JSON.parse(str)[url])
        .then(scaffold => identifyUrlType(scaffold.url))
        .catch(() => {
          throw invalidUrlError();
        });
    } else if (isGitUrl(url)) {
      return {
        type: 'git',
        url,
      };
    } else if (isGithubShortUrl(url)) {
      const [user, repo] = url.split('/');
      const prefixedUrl = `${user}/pingy-scaffold-${repo}`;
      const unprefixedUrl = url;
      let token = null;
      if (global.conf && global.conf.has('githubToken')) {
        token = global.conf.get('githubToken');
      } else {
        token = process.env.PINGY_GITHUB_TOKEN;
      }
      const options = token ? { token } : null;
      return Promise.all([
        github(`repos/${prefixedUrl}`, options).catch(handleGithubError),
        github(`repos/${unprefixedUrl}`, options).catch(handleGithubError)
      ]).then(res => {
        let chosenRes;
        if (res[0] && res[0].body && res[0].body.git_url) {
          chosenRes = res[0];
        } else if (res[1] && res[1].body && res[1].body.git_url) {
          chosenRes = res[1];
        }
        if (!chosenRes) {
          throw new Error(
            `Couldn't find '${prefixedUrl}' or '${unprefixedUrl}' on github`
          );
        }
        return {
          type: 'git',
          url: chosenRes.body.git_url,
        };
      });
    }
    throw invalidUrlError();
  });
}

function scaffoldFs(scaffoldFrom) {
  return pathExists(scaffoldFrom).then(dirExists => {
    if (!dirExists) {
      throw new Error(`Folder '${scaffoldFrom}' does not exist on filesystem`);
    }
    const scaffoldJsonPath = join(scaffoldFrom, scaffoldFileName);
    return pathExists(scaffoldJsonPath).then(scaffoldExists => {
      if (!scaffoldExists) {
        throw new Error(`Scaffold doesn't contain a ${scaffoldFileName} file`);
      }
      return readJson(scaffoldJsonPath).then(json => {
        const { name, description } = json;
        if (!name || !description) {
          throw new Error(
            `${scaffoldFileName} should contain a name and a description`
          );
        }
        return {
          scaffoldPath: scaffoldFrom,
          json,
        };
      });
    });
  });
}

function scaffoldGit(url) {
  return mkdirp(cacheDir).then(() => {
    const repoDir = join(cacheDir, shaDigest(url));
    return gitPullOrClone(url, repoDir)
      .then(
        () => null,
        // If we get an error then try and rimraf the dir and clone from scratch
        () => rimraf(repoDir).then(() => gitPullOrClone(url, repoDir))
      )
      .then(() => scaffoldFs(repoDir));
  });
}

module.exports.cacheDir = cacheDir;

module.exports.identifyUrlType = identifyUrlType;

module.exports.fs = scaffoldFs;

module.exports.git = scaffoldGit;
