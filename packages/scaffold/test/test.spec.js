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

  before(() => {
    scaffold.conf.clear();
  });
  after(() => {
    expect(scaffold.conf.all, 'to have properties', {
      cache: {
        bootstrap: {
          type: 'git',
          url: 'git://github.com/pingyhq/pingy-scaffold-bootstrap.git',
        },
        'pingyhq/bootstrap': {
          type: 'git',
          url: 'git://github.com/pingyhq/pingy-scaffold-bootstrap.git',
        },
        'pingyhq/pingy-scaffold-bootstrap': {
          type: 'git',
          url: 'git://github.com/pingyhq/pingy-scaffold-bootstrap.git',
        },
      },
    });
    scaffold.conf.clear();
  });

  it('cache index should be clear', () =>
    expect(scaffold.conf.all, 'to be empty'));

  const gitUrl = 'git://github.com/pingyhq/pingy-scaffold-bootstrap.git';
  it('should work with git URL', () =>
    expect(scaffold.identifyUrlType(gitUrl), 'to be fulfilled with', {
      type: 'git',
      url: gitUrl,
    }));

  it('should work with Shorthand GitHub URL (1)', () => {
    const url = 'pingyhq/bootstrap';
    return expect(scaffold.identifyUrlType(url), 'to be fulfilled with', {
      type: 'git',
      url: gitUrl,
    });
  });

  it('should work with Shorthand GitHub URL (2)', () => {
    const url = 'pingyhq/pingy-scaffold-bootstrap';
    return expect(scaffold.identifyUrlType(url), 'to be fulfilled with', {
      type: 'git',
      url: gitUrl,
    });
  });

  it('should work with alias', () => {
    const alias = 'bootstrap';
    return expect(scaffold.identifyUrlType(alias), 'to be fulfilled with', {
      type: 'git',
      url: gitUrl,
    });
  });

  it('should work with path', () => {
    const pth = path.join(__dirname, 'fixtures', 'a');
    return expect(scaffold.identifyUrlType(pth), 'to be fulfilled with', {
      type: 'fs',
      url: pth,
    });
  });

  const errText = type =>
    `Not a valid Pingy scaffold ${type || 'url/path/alias'}.`;
  it('should fail with incorrect path', () => {
    const pth = path.join(__dirname, 'foo');
    return expect(
      scaffold.identifyUrlType(pth),
      'to be rejected with',
      new Error(errText())
    );
  });

  it('should fail with incorrect alias', () =>
    expect(
      scaffold.identifyUrlType('foo'),
      'to be rejected with',
      new Error(errText('alias'))
    ));

  it('should fail with incorrect shorthand GitHub URL', () => {
    const url = 'pingyhq/does-not-exist';
    return expect(
      scaffold.identifyUrlType(url),
      'to be rejected with error satisfying',
      /Couldn't find/
    );
  });

  it('should not fail with incorrect github URL', () => {
    const url = 'git://github.com/foo/bar.git';
    return expect(scaffold.identifyUrlType(url), 'to be fulfilled with', {
      type: 'git',
      url,
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

parallel('scaffoldGit', function scaffoldGit() {
  this.timeout(10000);
  it('should error with 404 url', () => {
    const url = 'https://github.com/foo/does-not-exist.git';

    return expect(
      scaffold.git(url),
      'to be rejected with error satisfying',
      /Non-zero exit code/
    );
  });

  it('should error when no pingy-scaffold.json', () => {
    const url = 'https://github.com/rmccue/test-repository.git';

    return expect(
      scaffold.git(url),
      'to be rejected with error satisfying',
      /doesn't contain a pingy-scaffold.json/
    );
  });

  it('should work with valid scaffold repo', () => {
    const url =
      'git://github.com/pingyhq/pingy-scaffold-bootstrap-jumbotron.git';

    return expect(scaffold.git(url), 'to be fulfilled with', {
      scaffoldPath: expect.it('to contain', scaffold.cacheDir),
      json: expect.it('to have keys', ['name', 'description']),
    });
  });
});
