'use strict';

require('dotenv').config();
const expect = require('unexpected').clone();
const parallel = require('mocha.parallel');
const path = require('path');
// eslint-disable-next-line import/no-extraneous-dependencies
const scaffold = require('@pingy/scaffold');

// TODO: test offline

parallel('identifyUrlType', function identifyUrlType() {
  this.timeout(10000);

  it('should work with GitHub URL (1)', () => {
    const url = 'git://github.com/pingyhq/pingy-scaffold-bootstrap.git';
    return expect(scaffold.identifyUrlType(url), 'to be fulfilled with', {
      type: 'npm',
      url,
    });
  });

  it('should work with Shorthand GitHub URL (2)', () => {
    const url = 'pingyhq/pingy-scaffold-bootstrap';
    return expect(scaffold.identifyUrlType(url), 'to be fulfilled with', {
      type: 'npm',
      url,
    });
  });

  it('should work with alias', () => {
    const alias = 'bootstrap';
    const url = 'pingy-scaffold-bootstrap';
    return expect(scaffold.identifyUrlType(alias), 'to be fulfilled with', {
      type: 'npm',
      url,
    });
  });

  it('should work with path', () => {
    const pth = path.join(__dirname, 'fixtures', 'a');
    return expect(scaffold.identifyUrlType(pth), 'to be fulfilled with', {
      type: 'fs',
      url: pth,
    });
  });
});

parallel('scaffoldFs', () => {
  it('should return path and json on success', () => {
    const pth = path.join(__dirname, 'fixtures', 'a');

    return expect(scaffold.fs(pth), 'to be fulfilled with', {
      scaffoldPath: pth,
      json: expect.it('to have keys', ['name', 'description']),
    });
  });

  it('should error when no pingy-scaffold.json', () => {
    const pth = path.join(__dirname);

    return expect(
      scaffold.fs(pth),
      'to be rejected with error satisfying',
      /doesn't contain a pingy-scaffold.json/
    );
  });

  it('should error with invalid path', () => {
    const pth = path.join(__dirname, 'fixtures', 'b');

    return expect(
      scaffold.fs(pth),
      'to be rejected with error satisfying',
      /should contain a name and a description/
    );
  });

  it('should error with invalid path', () => {
    const pth = path.join(__dirname, 'foo');

    return expect(
      scaffold.fs(pth),
      'to be rejected with error satisfying',
      /does not exist/
    );
  });
});

parallel('scaffoldNpm', function scaffoldGit() {
  this.timeout(10000);
  it('should error with 404 url', () => {
    const url = 'https://github.com/foo/does-not-exist.git';

    return expect(
      scaffold.npm(url),
      'to be rejected with error satisfying',
      /Repository not found/
    );
  });

  it('should error when no package.json', () => {
    const url = 'https://github.com/rmccue/test-repository.git';

    return expect(
      scaffold.npm(url),
      'to be rejected with error satisfying',
      /missing package.json/
    );
  });

  it('should error when no pingy-scaffold.json', () => {
    const url = 'cnpm/npminstall';

    return expect(
      scaffold.npm(url),
      'to be rejected with error satisfying',
      /doesn't contain a pingy-scaffold.json/
    );
  });

  it('should work with valid scaffold repo', () => {
    const url =
      'git://github.com/pingyhq/pingy-scaffold-bootstrap-jumbotron.git';

    return expect(scaffold.npm(url), 'to be fulfilled with', {
      scaffoldPath: expect.it('to contain', scaffold.cacheDir),
      json: expect.it('to have keys', ['name', 'description']),
    });
  });
});
