'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var baconize = require('../');
var rimraf = require('rimraf');
var when = require('when');
var nodefn = require('when/node');
var fs = nodefn.liftAll(require('fs'));

function getPathIn(path) {
  return Path.join(process.cwd(), 'examples/site', path || '');
}

function getPathOut(path) {
  return Path.join(process.cwd(), 'examples/output', path || '');
}

describe('baconize', function() {

  var clearDir = function(cb) { rimraf(getPathOut(), cb); };

  before(clearDir);
  after(clearDir);

  it('should compile compilable files and copy all others', function () {
    return expect(baconize(getPathIn(), getPathOut()), 'to be fulfilled with', 4);
  });

  describe('after compilation', function() {

    it('should have all compiled files', function() {
      return when.all([
        fs.readFile(getPathOut('index.html')),
        fs.readFile(getPathOut('styles/main.css')),
        fs.readFile(getPathOut('scripts/main.js')),
        fs.readFile(getPathOut('about.html'))
      ]).then(function(results) {
        return expect.promise.all([
          expect(results[0].toString(), 'to contain', '<title>Piggy'),
          expect(results[1].toString(), 'to contain', 'body {'),
          expect(results[2].toString(), 'to contain', 'console.log("H'),
          expect(results[3].toString(), 'to contain', '<title>Some')
        ]);
      });
    });

    it('should URL link to source maps', function() {
      return when.all([
        fs.readFile(getPathOut('styles/main.css')),
        fs.readFile(getPathOut('scripts/main.js')),
      ]).then(function(results) {
        return expect.promise.all([
          expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
          expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map'),
        ]);
      });
    });

    it('should have source maps', function() {
      return when.all([
        fs.readFile(getPathOut('styles/main.css.map')),
        fs.readFile(getPathOut('scripts/main.js.map')),
      ]).then(function(results) {
        return expect.promise.all([
          expect(results[0].toString(), 'to contain', '"file":"main.css"')
            .and('to contain', '"sources":["main.styl"]'),
          expect(results[1].toString(), 'to contain', '"file":"main.js"')
            .and('to contain', '"sources":["main.coffee"]'),
        ]);
      });
    });

    it('should not copy pre-compiled files', function() {
      return fs.readFile(getPathOut('index.jade'))
        .then(function() {
          return expect.fail('index.jade should not have been copied');
        }, function(err) {
          return expect(err.code, 'to be', 'ENOENT');
        });
    });

  });

});
