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

describe('baconize', () => {
  var clearDir = function (cb) {
    rimraf(getPathOut(), cb);
  };

  describe('compile', () => {
    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', () => {
      var options = {
        exclusions: [
          {
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },
          {
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false,
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', (dir) => {
        dirs.push(dir);
      });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', (file) => {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', (file) => {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(num => expect.promise.all([
        expect(num, 'to be', 8),
        expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
        expect(
            compiledFiles,
            'to contain',
            'index.jade',
            'scripts/main.coffee',
            'styles/main.styl',
            'scripts/log.babel.js'
          )
            .and('not to contain', 'about.html', 'styles/typography.css', 'styles/typography.css')
            .and('to have length', 4)
      ]));
    });

    describe('after compilation', () => {
      it('should have all compiled files', () => when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', "saying 'hello'.\n"),
            expect(results[1].toString(), 'to contain', 'body {'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(
                results[3].toString(),
                'to contain',
                'for (var i = 0; i < stuff.length; i++) {'
              ),
            expect(results[4].toString(), 'to contain', '  <head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', '  font-family: arial;')
          ])));

      it('should not copy pre-compiled files', () => fs.readFile(getPathOut('index.jade')).then(
          () => expect.fail('`index.jade` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not compile blacklist matches', () => fs.readFile(getPathOut('dont-compile/foo.js')).then(
          () => expect.fail('`dont-compile/foo.js` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not copy ignore paths', () => fs.stat(getPathOut('dont-copy')).then(
          () => expect.fail('`dont-copy` directory should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));
    });
  });

  describe('compile with sourcemaps', () => {
    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', () => {
      var options = {
        exclusions: [
          {
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },
          {
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: true,
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', (dir) => {
        dirs.push(dir);
      });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', (file) => {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', (file) => {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(num => expect.promise.all([
        expect(num, 'to be', 8),
        expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
        expect(
            compiledFiles,
            'to contain',
            'index.jade',
            'scripts/main.coffee',
            'styles/main.styl',
            'scripts/log.babel.js'
          )
            .and('not to contain', 'about.html', 'styles/typography.css', 'styles/typography.css')
            .and('to have length', 4)
      ]));
    });

    describe('after compilation', () => {
      it('should have all compiled files', () => when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', "saying 'hello'.\n"),
            expect(results[1].toString(), 'to contain', 'body {'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(
                results[3].toString(),
                'to contain',
                'for (var i = 0; i < stuff.length; i++) {'
              ),
            expect(results[4].toString(), 'to contain', '  <head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', '  font-family: arial;')
          ])));

      it('should URL link to source maps', () => when
          .all([
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
            expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map')
          ])));

      it('should have source maps', () => when
          .all([
            fs.readFile(getPathOut('styles/main.css.map')),
            fs.readFile(getPathOut('scripts/main.js.map'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', '"file":"main.css"').and(
                'to contain',
                '"sources":["main.styl","../dont-copy/_inner.styl"]'
              ),
            expect(results[1].toString(), 'to contain', '"file":"main.js"').and(
                'to contain',
                '"sources":["main.coffee"]'
              )
          ])));

      it('should copy pre-compiled source files', () => fs.readFile(getPathOut('index.jade')).then(results => expect(results.toString(), 'to contain', 'html(lang="en")')));

      it('should not compile blacklist matches', () => fs.readFile(getPathOut('dont-compile/foo.js')).then(
          () => expect.fail('`dont-compile/foo.js` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not copy ignore paths', () => fs.stat(getPathOut('dont-copy')).then(
          () => expect.fail('`dont-copy` directory should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));
    });
  });

  describe('compile minified', () => {
    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', () => {
      var options = {
        exclusions: [
          {
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },
          {
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false,
        minify: true,
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', (dir) => {
        dirs.push(dir);
      });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', (file) => {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', (file) => {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(num => expect.promise.all([
        expect(num, 'to be', 8),
        expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
        expect(
            compiledFiles,
            'to contain',
            'about.html',
            'index.jade',
            'scripts/log.babel.js',
            'styles/main.styl',
            'styles/typography.css',
            'scripts/iterate.js',
            'scripts/main.coffee'
          ).and('to have length', 7)
      ]));
    });

    describe('after compilation', () => {
      it('should have all compiled files', () => when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', "saying 'hello'.</p>"),
            expect(results[1].toString(), 'to contain', 'body{'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
            expect(results[4].toString(), 'to contain', '<html><head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', 'font-family:arial}')
          ])));

      it('should not copy pre-compiled files', () => fs.readFile(getPathOut('index.jade')).then(
          () => expect.fail('`index.jade` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not compile blacklist matches', () => fs.readFile(getPathOut('dont-compile/foo.js')).then(
          () => expect.fail('`dont-compile/foo.js` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not copy ignore paths', () => fs.stat(getPathOut('dont-copy')).then(
          () => expect.fail('`dont-copy` directory should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));
    });
  });

  describe('compile minified with sourcemaps', () => {
    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', () => {
      var options = {
        exclusions: [
          {
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },
          {
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        minify: true,
        sourcemaps: true,
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      var dirs = [];
      bacon.events.on('chdir', (dir) => {
        dirs.push(dir);
      });

      var compiledFiles = [];
      var lastStartedFile;
      bacon.events.on('compile-start', (file) => {
        lastStartedFile = file.path;
      });
      bacon.events.on('compile-done', (file) => {
        if (lastStartedFile === file.path) {
          compiledFiles.push(file.path);
        } else {
          expect.fail('Unexpected compile-done event');
        }
      });

      return bacon.then(num => expect.promise.all([
        expect(num, 'to be', 8),
        expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
        expect(
            compiledFiles,
            'to contain',
            'about.html',
            'index.jade',
            'scripts/log.babel.js',
            'styles/main.styl',
            'styles/typography.css',
            'scripts/iterate.js',
            'scripts/main.coffee'
          ).and('to have length', 7)
      ]));
    });

    describe('after compilation', () => {
      it('should have all compiled files', () => when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', "saying 'hello'.</p>"),
            expect(results[1].toString(), 'to contain', 'body{'),
            expect(results[2].toString(), 'to contain', 'console.log("H'),
            expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
            expect(results[4].toString(), 'to contain', '<html><head>'),
            expect(results[5].toString(), 'to contain', 'console.log "T'),
            expect(results[6].toString(), 'to contain', 'font-family:arial}')
          ])));

      it('should URL link to source maps', () => when
          .all([
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
            expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map'),
            expect(results[2].toString(), 'to contain', '//# sourceMappingURL=iterate.js.map'),
            expect(
                results[3].toString(),
                'to contain',
                '/*# sourceMappingURL=typography.css.map*/'
              )
          ])));

      it('should have source maps', () => when
          .all([
            fs.readFile(getPathOut('styles/main.css.map')),
            fs.readFile(getPathOut('scripts/main.js.map')),
            fs.readFile(getPathOut('scripts/iterate.js.map')),
            fs.readFile(getPathOut('styles/typography.css.map'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', '"file":"main.css"').and(
                'to contain',
                '"sources":["main.styl","../dont-copy/_inner.styl"]'
              ),
            expect(results[1].toString(), 'to contain', '"file":"main.js"').and(
                'to contain',
                '"sources":["main.coffee"]'
              ),
            expect(results[2].toString(), 'to contain', '"file":"iterate.js"').and(
                'to contain',
                '"sources":["iterate.src.js"]'
              ),
            expect(results[3].toString(), 'to contain', '"file":"typography.css"').and(
                'to contain',
                '"sources":["typography.src.css"]'
              )
          ])));

      it('should copy pre-compiled source files', () => when
          .all([
            fs.readFile(getPathOut('index.jade')),
            fs.readFile(getPathOut('about.src.html')),
            fs.readFile(getPathOut('scripts/iterate.src.js')),
            fs.readFile(getPathOut('styles/typography.src.css'))
          ])
          .then(results => expect.promise.all([
            expect(results[0].toString(), 'to contain', 'html(lang="en")'),
            expect(results[1].toString(), 'to contain', '  <meta charset="utf-8">'),
            expect(
                results[2].toString(),
                'to contain',
                'for (var i = 0; i < stuff.length; i++) {'
              ),
            expect(results[3].toString(), 'to contain', '  font-family: arial;')
          ])));

      it('should not compile blacklist matches', () => fs.readFile(getPathOut('dont-compile/foo.js')).then(
          () => expect.fail('`dont-compile/foo.js` should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));

      it('should not copy ignore paths', () => fs.stat(getPathOut('dont-copy')).then(
          () => expect.fail('`dont-copy` directory should not be copied'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));
    });
  });

  describe('aborted compile', () => {
    before(clearDir);
    after(clearDir);

    it('should abort during compile process', () => {
      var options = {
        exclusions: [
          {
            path: 'dont-copy',
            action: 'exclude',
            type: 'dir',
          },
          {
            path: 'dont-compile',
            action: 'dontCompile',
            type: 'dir',
          }
        ],
        compile: true,
        sourcemaps: false,
      };
      var bacon = baconize(getPathIn(), getPathOut(), options);

      setTimeout(() => {
        bacon.abort();
      }, 10);

      return bacon.then(
        () => expect.fail('Baconize should not have completed, should have been aborted'),
        err => expect(err.code, 'to be', 'ABORT')
      );
    });

    describe('after aborted compilation', () => {
      it('should have removed all files', () => when.all(fs.readdir(getPathOut())).then(
          () => expect.fail('Output dir should not exist after abort'),
          err => expect(err.code, 'to be', 'ENOENT')
        ));
    });
  });

  describe('preflight', () => {
    var emptyDir = Path.join(process.cwd(), 'empty-dir');
    var existingDir = Path.join(process.cwd(), 'examples');
    var enoentDir = Path.join(process.cwd(), 'enoent');

    before(() => {
      fs.mkdirSync(emptyDir);
    });
    after(() => {
      fs.rmdirSync(emptyDir);
    });

    it('should work (basic test)', () => baconize.preflight(process.cwd()).then(info => expect(info, 'to have properties', {
      empty: false,
      exists: true,
      nodeModules: true,
      bowerComponents: false,
      outputDir: null,
    })));

    it('should have enoent output dir', () => baconize.preflight(process.cwd(), enoentDir).then(info => expect(info, 'to have properties', {
      empty: false,
      exists: true,
      nodeModules: true,
      bowerComponents: false,
      outputDir: { empty: true, exists: false, files: 0 },
    })));

    it('should have existing non-empty output dir', () => baconize.preflight(process.cwd(), existingDir).then((info) => {
      expect(info, 'to have properties', {
        empty: false,
        exists: true,
        nodeModules: true,
        bowerComponents: false,
      });
      expect(info.outputDir.empty, 'to be false');
      expect(info.outputDir.exists, 'to be true');
      expect(info.outputDir.files, 'to be greater than', 0);
    }));

    it('should have existing empty output dir', () => baconize.preflight(process.cwd(), emptyDir).then(info => expect(info, 'to have properties', {
      empty: false,
      exists: true,
      nodeModules: true,
      bowerComponents: false,
      outputDir: { empty: true, exists: true, files: 0 },
    })));
  });
});
