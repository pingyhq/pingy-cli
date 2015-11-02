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

  var clearDir = function(cb) {
    rimraf(getPathOut(), cb);
  };

  describe('compile', function() {

    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', function () {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
        compile: true,
        sourcemaps: false
      };
      return expect(baconize(getPathIn(), getPathOut(), options), 'to be fulfilled with', 7);
    });

    describe('after compilation', function() {

      it('should have all compiled files', function() {
        return when.all([
          fs.readFile(getPathOut('index.html')),
          fs.readFile(getPathOut('styles/main.css')),
          fs.readFile(getPathOut('scripts/main.js')),
          fs.readFile(getPathOut('scripts/iterate.js')),
          fs.readFile(getPathOut('about.html')),
          fs.readFile(getPathOut('dont-compile/foo.coffee')),
          fs.readFile(getPathOut('styles/typography.css'))
        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', 'saying \'hello\'.\n'),
            expect(results[1].toString(), 'to contain', 'body {'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for (var i = 0; i < stuff.length; i++) {'),
            expect(results[4].toString(), 'to contain', '  <head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', '  font-family: arial;')
          ]);
        });
      });

      it('should not copy pre-compiled files', function() {
        return fs.readFile(getPathOut('index.jade'))
          .then(function() {
            return expect.fail('`index.jade` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not compile blacklist matches', function() {
        return fs.readFile(getPathOut('dont-compile/foo.js'))
          .then(function() {
            return expect.fail('`dont-compile/foo.js` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not copy ignore paths', function() {
        return fs.stat(getPathOut('dont-copy'))
          .then(function() {
            return expect.fail('`dont-copy` directory should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

    });
  });

  describe('compile with sourcemaps', function() {

    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', function () {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
        compile: true,
        sourcemaps: true
      };
      return expect(baconize(getPathIn(), getPathOut(), options), 'to be fulfilled with', 7);
    });

    describe('after compilation', function() {

      it('should have all compiled files', function() {
        return when.all([
          fs.readFile(getPathOut('index.html')),
          fs.readFile(getPathOut('styles/main.css')),
          fs.readFile(getPathOut('scripts/main.js')),
          fs.readFile(getPathOut('scripts/iterate.js')),
          fs.readFile(getPathOut('about.html')),
          fs.readFile(getPathOut('dont-compile/foo.coffee')),
          fs.readFile(getPathOut('styles/typography.css'))
        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', 'saying \'hello\'.\n'),
            expect(results[1].toString(), 'to contain', 'body {'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for (var i = 0; i < stuff.length; i++) {'),
            expect(results[4].toString(), 'to contain', '  <head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', '  font-family: arial;')
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

      it('should copy pre-compiled source files', function() {
        return fs.readFile(getPathOut('index.jade')).then(function(results) {
            return expect(results.toString(), 'to contain', 'html(lang="en")');
          });
      });

      it('should not compile blacklist matches', function() {
        return fs.readFile(getPathOut('dont-compile/foo.js'))
          .then(function() {
            return expect.fail('`dont-compile/foo.js` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not copy ignore paths', function() {
        return fs.stat(getPathOut('dont-copy'))
          .then(function() {
            return expect.fail('`dont-copy` directory should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

    });
  });


  describe('compile minified', function() {

    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', function () {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
        compile: true,
        sourcemaps: false,
        minify: true
      };
      return expect(baconize(getPathIn(), getPathOut(), options), 'to be fulfilled with', 7);
    });

    describe('after compilation', function() {

      it('should have all compiled files', function() {
        return when.all([
          fs.readFile(getPathOut('index.html')),
          fs.readFile(getPathOut('styles/main.css')),
          fs.readFile(getPathOut('scripts/main.js')),
          fs.readFile(getPathOut('scripts/iterate.js')),
          fs.readFile(getPathOut('about.html')),
          fs.readFile(getPathOut('dont-compile/foo.coffee')),
          fs.readFile(getPathOut('styles/typography.css'))
        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', 'saying \'hello\'.</p>'),
            expect(results[1].toString(), 'to contain', 'body{'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
            expect(results[4].toString(), 'to contain', '<html><head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', 'font-family:arial}')
          ]);
        });
      });

      it('should not copy pre-compiled files', function() {
        return fs.readFile(getPathOut('index.jade'))
          .then(function() {
            return expect.fail('`index.jade` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not compile blacklist matches', function() {
        return fs.readFile(getPathOut('dont-compile/foo.js'))
          .then(function() {
            return expect.fail('`dont-compile/foo.js` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not copy ignore paths', function() {
        return fs.stat(getPathOut('dont-copy'))
          .then(function() {
            return expect.fail('`dont-copy` directory should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

    });
  });

  describe('compile minified with sourcemaps', function() {

    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', function () {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
        compile: true,
        minify: true,
        sourcemaps: true
      };
      return expect(baconize(getPathIn(), getPathOut(), options), 'to be fulfilled with', 7);
    });

    describe('after compilation', function() {

      it('should have all compiled files', function() {
        return when.all([
          fs.readFile(getPathOut('index.html')),
          fs.readFile(getPathOut('styles/main.css')),
          fs.readFile(getPathOut('scripts/main.js')),
          fs.readFile(getPathOut('scripts/iterate.js')),
          fs.readFile(getPathOut('about.html')),
          fs.readFile(getPathOut('dont-compile/foo.coffee')),
          fs.readFile(getPathOut('styles/typography.css'))
        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', 'saying \'hello\'.</p>'),
            expect(results[1].toString(), 'to contain', 'body{'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
            expect(results[4].toString(), 'to contain', '<html><head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', 'font-family:arial}')
          ]);
        });
      });

      it('should URL link to source maps', function() {
        return when.all([
          fs.readFile(getPathOut('styles/main.css')),
          fs.readFile(getPathOut('scripts/main.js')),
          fs.readFile(getPathOut('scripts/iterate.js')),
          fs.readFile(getPathOut('styles/typography.css'))

        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
            expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map'),
            expect(results[2].toString(), 'to contain', '//# sourceMappingURL=iterate.js.map'),
            expect(results[3].toString(), 'to contain', '/*# sourceMappingURL=typography.css.map*/')

          ]);
        });
      });

      it('should have source maps', function() {
        return when.all([
          fs.readFile(getPathOut('styles/main.css.map')),
          fs.readFile(getPathOut('scripts/main.js.map')),
          fs.readFile(getPathOut('scripts/iterate.js.map')),
          fs.readFile(getPathOut('styles/typography.css.map'))
        ]).then(function(results) {
          return expect.promise.all([
            expect(results[0].toString(), 'to contain', '"file":"main.css"')
              .and('to contain', '"sources":["main.styl"]'),
            expect(results[1].toString(), 'to contain', '"file":"main.js"')
              .and('to contain', '"sources":["main.coffee"]'),
            expect(results[2].toString(), 'to contain', '"file":"iterate.js"')
              .and('to contain', '"sources":["iterate.src.js"]'),
            expect(results[3].toString(), 'to contain', '"file":"typography.css"')
              .and('to contain', '"sources":["typography.src.css"]'),
          ]);
        });
      });

      it('should copy pre-compiled source files', function() {
        return when.all([
          fs.readFile(getPathOut('index.jade')),
          fs.readFile(getPathOut('about.src.html')),
          fs.readFile(getPathOut('scripts/iterate.src.js')),
          fs.readFile(getPathOut('styles/typography.src.css'))
        ]).then(function(results) {
            return expect.promise.all([
              expect(results[0].toString(), 'to contain', 'html(lang="en")'),
              expect(results[1].toString(), 'to contain', '  <meta charset="utf-8">'),
              expect(results[2].toString(), 'to contain', 'for (var i = 0; i < stuff.length; i++) {'),
              expect(results[3].toString(), 'to contain', '  font-family: arial;')
            ]);
          });
      });

      it('should not compile blacklist matches', function() {
        return fs.readFile(getPathOut('dont-compile/foo.js'))
          .then(function() {
            return expect.fail('`dont-compile/foo.js` should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

      it('should not copy ignore paths', function() {
        return fs.stat(getPathOut('dont-copy'))
          .then(function() {
            return expect.fail('`dont-copy` directory should not be copied');
          }, function(err) {
            return expect(err.code, 'to be', 'ENOENT');
          });
      });

    });
  });

});
