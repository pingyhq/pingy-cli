'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var baconize = require('../');
var rimraf = require('rimraf');
var when = require('when');
var nodefn = require('when/node');
var fs = nodefn.liftAll(require('fs'));

var norm = Path.normalize.bind(Path);
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
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            'index.jade',
            norm('scripts/main.coffee'),
            norm('styles/main.styl'),
            norm('scripts/log.babel.js')
          )
            .and('not to contain', norm('about.html'), norm('styles/typography.css'))
            .and('to have length', 4)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css')),
            fs.readFile(getPathOut('scripts/log.js'))
          ])
          .then(results =>
            expect.promise.all([
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
              expect(results[6].toString(), 'to contain', '  font-family: arial;'),
              expect(results[7].toString(), 'to contain', 'var foo = function foo() {')
            ])
          ));

      it('should not copy pre-compiled files', () =>
        fs
          .readFile(getPathOut('index.jade'))
          .then(
            () => expect.fail('`index.jade` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
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
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            norm('index.jade'),
            norm('scripts/main.coffee'),
            norm('styles/main.styl'),
            norm('scripts/log.babel.js')
          )
            .and('not to contain', norm('about.html'), norm('styles/typography.css'))
            .and('to have length', 4)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
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
            ])
          ));

      it('should URL link to source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
              expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map')
            ])
          ));

      it('should have source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css.map')),
            fs.readFile(getPathOut('scripts/main.js.map'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '"file":"main.css"').and(
                'to contain',
                `"sources":["main.styl","..${norm('/dont-copy/_inner.styl')}"]`
              ),
              expect(results[1].toString(), 'to contain', '"file":"main.js"').and(
                'to contain',
                '"sources":["main.coffee"]'
              )
            ])
          ));

      it('should copy pre-compiled source files', () =>
        fs
          .readFile(getPathOut('index.jade'))
          .then(results => expect(results.toString(), 'to contain', 'html(lang="en")')));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
            () => expect.fail('`dont-copy` directory should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));
    });
  });

  describe('minify', () => {
    before(clearDir);
    after(clearDir);

    it('should compile compilable files and copy all others', () => {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
        compile: false,
        minify: true,
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

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            norm('about.html'),
            norm('styles/typography.css'),
            norm('scripts/iterate.js')
          ).and('to have length', 3)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('styles/typography.css')),
            fs.readFile(getPathOut('index.jade'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
              expect(results[1].toString(), 'to contain', '<html><head>'),
              expect(results[2].toString(), 'to contain', 'font-family:arial}'),
              expect(results[3].toString(), 'to contain', 'title Piggy In The Middle')
            ])
          ));

      it('should copy pre-compiled files', () =>
        fs
          .readFile(getPathOut('index.jade'))
          .then(() => true, () => expect.fail('`index.jade` should be copied')));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
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
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            'about.html',
            'index.jade',
            norm('scripts/log.babel.js'),
            norm('styles/main.styl'),
            norm('styles/typography.css'),
            norm('scripts/iterate.js'),
            norm('scripts/main.coffee')
          ).and('to have length', 7)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', "saying 'hello'.</p>"),
              expect(results[1].toString(), 'to contain', 'body{'),
              expect(results[2].toString(), 'to contain', 'console.log("H'),
              expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
              expect(results[4].toString(), 'to contain', '<html><head>'),
              expect(results[5].toString(), 'to contain', 'console.log "T'),
              expect(results[6].toString(), 'to contain', 'font-family:arial}')
            ])
          ));

      it('should not copy pre-compiled files', () =>
        fs
          .readFile(getPathOut('index.jade'))
          .then(
            () => expect.fail('`index.jade` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
            () => expect.fail('`dont-copy` directory should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));
    });
  });

  describe('compile minified with sourcemaps (with broken js)', () => {
    var originalJSContents;
    before(() =>
      // Uglify doesn't support es6 so it should not minify the file and just silently move on
      fs.readFile(getPathIn('scripts/iterate.js'), 'utf8').then((content) => {
        originalJSContents = content;
        return fs.writeFile(
          getPathIn('scripts/iterate.js'),
          `${content}\n const foo = (...args) => console.log(args)`
        );
      })
    );

    after(() => fs.writeFile(getPathIn('scripts/iterate.js'), originalJSContents));

    it('should compile compilable files and copy all others', () => {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            'about.html',
            'index.jade',
            norm('scripts/log.babel.js'),
            norm('styles/main.styl'),
            norm('styles/typography.css'),
            norm('scripts/main.coffee')
          ).and('to have length', 6)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', "saying 'hello'.</p>"),
              expect(results[1].toString(), 'to contain', 'body{'),
              expect(results[2].toString(), 'to contain', 'console.log("H'),
              expect(results[3].toString(), 'to contain', 'for (var i = 0;'),
              expect(results[4].toString(), 'to contain', '<html><head>'),
              expect(results[5].toString(), 'to contain', 'console.log "T'),
              expect(results[6].toString(), 'to contain', 'font-family:arial}')
            ])
          ));

      it('should URL link to source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
              expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map'),
              expect(
                results[2].toString(),
                'to contain',
                '/*# sourceMappingURL=typography.css.map*/'
              )
            ])
          ));

      it('should have source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css.map')),
            fs.readFile(getPathOut('scripts/main.js.map')),
            fs.readFile(getPathOut('styles/typography.css.map'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '"file":"main.css"').and(
                'to contain',
                `"sources":["main.styl","..${norm('/dont-copy/_inner.styl')}"]`
              ),
              expect(results[1].toString(), 'to contain', '"file":"main.js"').and(
                'to contain',
                '"sources":["main.coffee"]'
              ),
              expect(results[2].toString(), 'to contain', '"file":"typography.css"').and(
                'to contain',
                '"sources":["typography.src.css"]'
              )
            ])
          ));

      it('should copy pre-compiled source files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.jade')),
            fs.readFile(getPathOut('about.src.html')),
            fs.readFile(getPathOut('styles/typography.src.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', 'html(lang="en")'),
              expect(results[1].toString(), 'to contain', '  <meta charset="utf-8">'),
              expect(results[2].toString(), 'to contain', '  font-family: arial;')
            ])
          ));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
            () => expect.fail('`dont-copy` directory should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));
    });
  });

  describe('compile minified with sourcemaps (SHA test)', () => {
    var originalStylContents;
    before(() => {
      // Mess up the dir a bit to make sure we recompile files as needed.
      var coffee = fs
        .readFile(getPathOut('scripts/main.js'), 'utf8')
        .then(content => fs.writeFile(getPathOut('scripts/main.js'), `${content} `));
      var html = fs.unlink(getPathOut('index.html'));
      var randomFile = fs.writeFile(getPathOut('bla.html'), 'SHOULD BE REMOVED');

      // TODO: write a test where the input file is changed.
      var styl = fs.readFile(getPathIn('dont-copy/_inner.styl'), 'utf8').then((content) => {
        originalStylContents = content;
        return fs.writeFile(getPathIn('dont-copy/_inner.styl'), `${content} `);
      });

      return when.all([styl, html, randomFile, coffee]);
    });

    after((done) => {
      var coffee = fs.writeFile(getPathIn('dont-copy/_inner.styl'), originalStylContents);
      coffee.then(() => {
        clearDir(done);
      });
    });

    it('should compile compilable files and copy all others', () => {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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
      var compilationReuseFiles = [];
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
      bacon.events.on('compile-reuse', (file) => {
        compilationReuseFiles.push(file.path);
      });

      return bacon.then(num =>
        expect.promise.all([
          expect(num, 'to be', 9),
          expect(dirs, 'to contain', '', 'dont-compile', 'scripts', 'styles').and(
            'to have length',
            4
          ),
          expect(
            compiledFiles,
            'to contain',
            'index.jade',
            norm('styles/main.styl'),
            norm('scripts/main.coffee'),
            norm('scripts/iterate.js')
          ).and('to have length', 4),
          expect(
            compilationReuseFiles,
            'to contain',
            'about.html',
            norm('scripts/log.babel.js'),
            norm('styles/typography.css')
          ).and('to have length', 3)
        ])
      );
    });

    describe('after compilation', () => {
      it('should have all compiled files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.html')),
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('about.html')),
            fs.readFile(getPathOut('dont-compile/foo.coffee')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', "saying 'hello'.</p>"),
              expect(results[1].toString(), 'to contain', 'body{'),
              expect(results[2].toString(), 'to contain', 'console.log("H'),
              expect(results[3].toString(), 'to contain', 'for(var stuff=[1,2,3,4,5]'),
              expect(results[4].toString(), 'to contain', '<html><head>'),
              expect(results[5].toString(), 'to contain', 'console.log "T'),
              expect(results[6].toString(), 'to contain', 'font-family:arial}')
            ])
          ));

      it('should URL link to source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css')),
            fs.readFile(getPathOut('scripts/main.js')),
            fs.readFile(getPathOut('scripts/iterate.js')),
            fs.readFile(getPathOut('styles/typography.css'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '/*# sourceMappingURL=main.css.map*/'),
              expect(results[1].toString(), 'to contain', '//# sourceMappingURL=main.js.map'),
              expect(results[2].toString(), 'to contain', '//# sourceMappingURL=iterate.js.map'),
              expect(
                results[3].toString(),
                'to contain',
                '/*# sourceMappingURL=typography.css.map*/'
              )
            ])
          ));

      it('should have source maps', () =>
        when
          .all([
            fs.readFile(getPathOut('styles/main.css.map')),
            fs.readFile(getPathOut('scripts/main.js.map')),
            fs.readFile(getPathOut('scripts/iterate.js.map')),
            fs.readFile(getPathOut('styles/typography.css.map'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', '"file":"main.css"').and(
                'to contain',
                `"sources":["main.styl","..${norm('/dont-copy/_inner.styl')}"]`
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
            ])
          ));

      it('should copy pre-compiled source files', () =>
        when
          .all([
            fs.readFile(getPathOut('index.jade')),
            fs.readFile(getPathOut('about.src.html')),
            fs.readFile(getPathOut('scripts/iterate.src.js')),
            fs.readFile(getPathOut('styles/typography.src.css')),
            fs.readFile(getPathOut('styles/main.styl'))
            // fs.readFile(getPathOut('dont-copy/_inner.styl'))
          ])
          .then(results =>
            expect.promise.all([
              expect(results[0].toString(), 'to contain', 'html(lang="en")'),
              expect(results[1].toString(), 'to contain', '  <meta charset="utf-8">'),
              expect(
                results[2].toString(),
                'to contain',
                'for (var i = 0; i < stuff.length; i++) {'
              ),
              expect(results[3].toString(), 'to contain', '  font-family: arial;'),
              expect(results[4].toString(), 'to contain', "@import '../dont-copy/_inner'")
              // expect(results[5].toString(), 'to contain', 'h1\n  color: darkgreen')
            ])
          ));

      it('should not compile blacklist matches', () =>
        fs
          .readFile(getPathOut('dont-compile/foo.js'))
          .then(
            () => expect.fail('`dont-compile/foo.js` should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not copy ignore paths', () =>
        fs
          .stat(getPathOut('dont-copy'))
          .then(
            () => expect.fail('`dont-copy` directory should not be copied'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it("should remove files that weren't in src dir", () =>
        fs
          .readFile(getPathOut('bla.html'))
          .then(
            () =>
              expect.fail("`bla.html` should *not* be copied because it's not in src directory"),
            err => expect(err.code, 'to be', 'ENOENT')
          ));

      it('should not compile files prefixed with `_`', () =>
        fs
          .readFile(getPathOut('dont-copy/_inner.css'))
          .then(
            () =>
              expect.fail('`_inner.styl` should *not* be compiled because it begins with `_` char'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));
    });
  });

  describe('aborted compile', () => {
    before(clearDir);
    after(clearDir);

    it('should abort during compile process', () => {
      var options = {
        blacklist: ['dont-compile/**'],
        directoryFilter: ['!dont-copy'],
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
      it('should have removed all files', () =>
        when
          .all(fs.readdir(getPathOut()))
          .then(
            () => expect.fail('Output dir should not exist after abort'),
            err => expect(err.code, 'to be', 'ENOENT')
          ));
    });
  });
});
