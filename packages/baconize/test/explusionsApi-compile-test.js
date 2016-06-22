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
        exclusions: [{
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },{
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', function(dir) { dirs.push(dir); });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', function(file) {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', function(file) {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(function(num) {
        return expect.promise.all([
          expect(num, 'to be', 7),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and('to have length', 4),
          expect(compiledFiles, 'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.styl')
            .and('not to contain', 'about.html', 'styles/typography.css', 'styles/typography.css')
            .and('to have length', 3)
        ]);
      });
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
        exclusions: [{
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },{
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: true
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', function(dir) { dirs.push(dir); });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', function(file) {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', function(file) {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(function(num) {
        return expect.promise.all([
          expect(num, 'to be', 7),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and('to have length', 4),
          expect(compiledFiles, 'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.styl')
            .and('not to contain', 'about.html', 'styles/typography.css', 'styles/typography.css')
            .and('to have length', 3)
        ]);
      });
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
        exclusions: [{
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },{
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false,
        minify: true
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', function(dir) { dirs.push(dir); });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', function(file) {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', function(file) {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });


      return bacon.then(function(num) {
        return expect.promise.all([
          expect(num, 'to be', 7),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and('to have length', 4),
          expect(compiledFiles, 'to contain',
                    'about.html', 'index.jade',
                    'styles/main.styl', 'styles/typography.css',
                    'scripts/iterate.js', 'scripts/main.coffee').and('to have length', 6),
        ]);
      });
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
        exclusions: [{
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },{
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        minify: true,
        sourcemaps: true
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', function(dir) { dirs.push(dir); });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', function(file) {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', function(file) {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });


      return bacon.then(function(num) {
        return expect.promise.all([
          expect(num, 'to be', 7),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and('to have length', 4),
          expect(compiledFiles, 'to contain',
                    'about.html', 'index.jade',
                    'styles/main.styl', 'styles/typography.css',
                    'scripts/iterate.js', 'scripts/main.coffee').and('to have length', 6),
        ]);
      });
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

  describe('aborted compile', function() {

    before(clearDir);
    after(clearDir);

    it('should abort during compile process', function () {
      var options = {
        exclusions: [{
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },{
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      setTimeout(function() { bacon.abort(); }, 10);

      return bacon.then(function() {
        return expect.fail('Baconize should not have completed, should have been aborted');
      }, function(err) {
        return expect(err.code, 'to be', 'ABORT');
      });
    });

    describe('after aborted compilation', function() {

      it('should have removed all files', function() {
        return when.all(fs.readdir(getPathOut())).then(function() {
          return expect.fail('Output dir should not exist after abort');
        }, function(err) {
          return expect(err.code, 'to be', 'ENOENT');
        });
      });

    });

  });

  describe('preflight', function() {
    it('should work (basic test)', function() {
      return baconize.preflight(process.cwd()).then(function(info) {
        return expect(info, 'to equal', {
          empty: false,
          exists: true,
          files: 11,
          nodeModules: true,
          bowerComponents: false
        })
      })
    })

  });

});
