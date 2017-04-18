/*jshint esnext: true */
'use strict';

var expect = require('unexpected').clone();
var barnyard = require('../');
var Path = require('path');
var rimraf = require('rimraf');
var _mkdirp = require('mkdirp');
var walk = require('./helpers').walk;
var Q = require('q');
var fs = require('fs');
var readFile = Q.denodeify(fs.readFile);
var writeFile = Q.denodeify(fs.writeFile);
var mkdirp = Q.denodeify(_mkdirp);

describe('barnyard', () => {
  var tmpDir = Path.join(process.cwd(), 'tmp/');
  var scriptsDir = Path.join(tmpDir, 'scripts/');
  var stylesDir = Path.join(tmpDir, 'styles/');

  var makeRelative = (files) => files.map(file => file.replace(tmpDir, ''));
  var _clearTmpDir = (cb) => mkdirp(tmpDir).then(() => rimraf(tmpDir, cb));
  var clearTmpDir = Q.denodeify(_clearTmpDir);

  after(clearTmpDir);

  describe('vanilla scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      var options = {};
      var barn = barnyard(tmpDir, options);

      return barn.then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.html', 'scripts/main.js', 'styles/main.css')
          .and('to have length', 3)
      );
    });

    it('should contain correct files', () =>
      walk(tmpDir).then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.html', 'scripts/main.js', 'styles/main.css')
          .and('to have length', 3)
      )
    );

    describe('index.html', () => {
      var filePath = Path.join(tmpDir, 'index.html');
      var fileContents;
      before(() =>
        readFile(filePath, 'utf8').then(data => fileContents = data)
      );

      it('should reference scripts and styles', () =>
        expect(fileContents, 'to contain', 'main.css', 'main.js')
      );

      it('should not reference babel polyfill or normalize', () =>
        expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css')
      );
    });

    describe('asset files', () => {
      it('should have contents', () => {
        var jsPath = Path.join(scriptsDir, 'main.js');
        var cssPath = Path.join(stylesDir, 'main.css');
        return Q.all([readFile(jsPath, 'utf8'), readFile(cssPath, 'utf8')])
          .then((files) =>
            files.forEach(file => expect(file.length, 'to be greater than', 10))
          );
      });
    });
  });



  describe('jade, scss & coffee scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      var options = {
        html: {
          type: 'jade'
        },
        styles: {
          type: 'scss'
        },
        scripts: {
          type: 'coffee'
        }
      };
      var barn = barnyard(tmpDir, options);

      return barn.then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.scss')
          .and('to have length', 3)
      );
    });

    it('should contain correct files', () =>
      walk(tmpDir).then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.scss')
          .and('to have length', 3)
      )
    );

    describe('index.jade', () => {
      var filePath = Path.join(tmpDir, 'index.jade');
      var fileContents;
      before(() =>
        readFile(filePath, 'utf8').then(data => fileContents = data)
      );

      it('should reference scripts and styles', () =>
        expect(fileContents, 'to contain', 'main.css', 'main.js')
      );

      it('should not reference babel polyfill or normalize', () =>
        expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css')
      );
    });

    describe('asset files', () => {
      it('should have contents', () => {
        var coffeePath = Path.join(scriptsDir, 'main.coffee');
        var scssPath = Path.join(stylesDir, 'main.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')])
          .then((files) =>
            files.forEach(file => expect(file.length, 'to be greater than', 10))
          );
      });
    });

  });

  describe('include babel polyfill + normalize', () => {

    describe('with html index', () => {
      before(clearTmpDir);
      it('should complete successfully', () => {
        var options = {
          babelPolyfill: true,
          normalizeCss: true,
          html: {
            type: 'html'
          },
          scripts: {
            type: 'babel'
          }
        };
        var barn = barnyard(tmpDir, options);

        return barn.then((files) =>
          expect(makeRelative(files),
            'to contain', 'index.html', 'scripts/main.babel.js', 'styles/main.css',
            'scripts/polyfill.js', 'styles/normalize.css', '.babelrc')
            .and('to have length', 6)
        );
      });

      it('should have correct references', () => {
        var filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', 'polyfill.js', 'normalize.css')
        );
      });

      it('should have correct files', () => {
        var pFilePath = Path.join(scriptsDir, 'polyfill.js');
        var nFilePath = Path.join(stylesDir, 'normalize.css');
        var pFile = readFile(pFilePath, 'utf8');
        var nFile = readFile(nFilePath, 'utf8');

        return Q.all([pFile, nFile]).then(
          files => {
            expect(files[0], 'to contain', 'babelPolyfill');
            expect(files[1], 'to contain', '/*! normalize.css');
          }
        );
      });
    });

    describe('with jade index', () => {
      before(clearTmpDir);
      it('should complete successfully', () => {
        var options = {
          babelPolyfill: true,
          normalizeCss: true,
          html: {
            type: 'jade'
          },
          scripts: {
            type: 'babel'
          }
        };
        var barn = barnyard(tmpDir, options);

        return barn.then((files) =>
          expect(makeRelative(files),
            'to contain', 'index.jade', 'scripts/main.babel.js', 'styles/main.css',
            'scripts/polyfill.js', 'styles/normalize.css', '.babelrc')
            .and('to have length', 6)
        );
      });

      it('should have correct references', () => {
        var filePath = Path.join(tmpDir, 'index.jade');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', 'polyfill.js', 'normalize.css')
        );
      });

      it('should have correct files', () => {
        var pFilePath = Path.join(scriptsDir, 'polyfill.js');
        var nFilePath = Path.join(stylesDir, 'normalize.css');
        var bFilePath = Path.join(tmpDir, '.babelrc');
        var pFile = readFile(pFilePath, 'utf8');
        var nFile = readFile(nFilePath, 'utf8');
        var bFile = readFile(bFilePath, 'utf8');

        return Q.all([pFile, nFile, bFile]).then(
          files => {
            expect(files[0], 'to contain', 'babelPolyfill');
            expect(files[1], 'to contain', '/*! normalize.css');
            expect(files[2], 'to contain', '"presets": ["es2015"]');
          }
        );
      });
    });

  });



  describe('jade, scss & coffee scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      var options = {
        styles: {
          type: 'scss'
        },
        html: {
          type: 'jade'
        },
        scripts: {
          type: 'coffee'
        }
      };
      var barn = barnyard(tmpDir, options);

      return barn.then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.scss')
          .and('to have length', 3)
      );
    });

    it('should contain correct files', () =>
      walk(tmpDir).then((files) =>
        expect(makeRelative(files),
          'to contain', 'index.jade', 'scripts/main.coffee', 'styles/main.scss')
          .and('to have length', 3)
      )
    );

    describe('index.jade', () => {
      var filePath = Path.join(tmpDir, 'index.jade');
      var fileContents;
      before(() =>
        readFile(filePath, 'utf8').then(data => fileContents = data)
      );

      it('should reference scripts and styles', () =>
        expect(fileContents, 'to contain', 'main.css', 'main.js')
      );

      it('should not reference babel polyfill or normalize', () =>
        expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css')
      );
    });

    describe('asset files', () => {
      it('should have contents', () => {
        var coffeePath = Path.join(scriptsDir, 'main.coffee');
        var scssPath = Path.join(stylesDir, 'main.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')])
          .then((files) =>
            files.forEach(file => expect(file.length, 'to be greater than', 10))
          );
      });
    });

  });

  describe('Rename output files', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      var options = {
        babelPolyfill: true,
        normalizeCss: true,
        styles: {
          type: 'scss',
          folder: 'css',
          file: 'styles'
        },
        html: {
          type: 'jade',
          file: '200'
        },
        scripts: {
          type: 'coffee',
          file: 'app',
          folder: 'js'
        }
      };
      var barn = barnyard(tmpDir, options);

      return barn.then((files) =>
        expect(makeRelative(files),
          'to contain', '200.jade', 'js/app.coffee', 'css/styles.scss',
          'js/polyfill.js', 'css/normalize.css')
          .and('to have length', 5)
      );
    });

    it('should contain correct files', () =>
      walk(tmpDir).then((files) =>
        expect(makeRelative(files),
          'to contain', '200.jade', 'js/app.coffee', 'css/styles.scss',
          'js/polyfill.js', 'css/normalize.css')
          .and('to have length', 5)
      )
    );

    describe('index.jade', () => {
      var filePath = Path.join(tmpDir, '200.jade');
      var fileContents;
      before(() =>
        readFile(filePath, 'utf8').then(data => fileContents = data)
      );

      it('should reference scripts and styles', () =>
        expect(fileContents, 'to contain', 'css/styles.css', 'js/app.js')
      );

      it('should reference babel polyfill or normalize', () =>
        expect(fileContents, 'to contain', 'js/polyfill.js', 'css/normalize.css')
      );
    });

    describe('asset files', () => {
      it('should have contents', () => {
        var coffeePath = Path.join(Path.join(tmpDir, 'js'), 'app.coffee');
        var scssPath = Path.join(Path.join(tmpDir, 'css'), 'styles.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')])
          .then((files) =>
            files.forEach(file => expect(file.length, 'to be greater than', 10))
          );
      });
    });

  });


  describe('whitespace', () => {
    describe('tabs', () => {
      before(clearTmpDir);

      it('should complete successfully', () =>
        barnyard(tmpDir, { whitespaceFormatting: 'tabs' }).then((files) =>
          expect(makeRelative(files), 'to have length', 3)
        )
      );

      it('should have correct references', () => {
        var filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n\t<').and('not to contain', '  ')
        );
      });
    });

    describe('2 spaces', () => {
      before(clearTmpDir);

      it('should complete successfully', () =>
        barnyard(tmpDir, { whitespaceFormatting: 2 }).then((files) =>
          expect(makeRelative(files), 'to have length', 3)
        )
      );

      it('should have correct references', () => {
        var filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n  <').and('not to contain', '\t')
        );
      });
    });

    describe('4 spaces', () => {
      before(clearTmpDir);

      it('should complete successfully', () =>
        barnyard(tmpDir, { whitespaceFormatting: 4 }).then((files) =>
          expect(makeRelative(files), 'to have length', 3)
        )
      );

      it('should have correct references', () => {
        var filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n    <').and('not to contain', '\n  <')
        );
      });
    });

  });

  describe('preflight (not empty)', () => {
    before(() =>
      clearTmpDir().then(() =>
        mkdirp(tmpDir).then(() =>
          writeFile(Path.join(tmpDir, 'helloworld.txt'), 'Hello World!')
        )
      )
    );

    it('should warn that dir is not empty', () => {
      var preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: false,
        exists: true,
        files: 1
      })
    });
  });

  describe('preflight (empty)', () => {
    before(() =>
      clearTmpDir().then(() => mkdirp(tmpDir))
    );

    it('should say dir is empty', () => {
      var preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: true,
        exists: true,
        files: 0
      })
    });
  });

  describe('preflight (non-exist)', () => {
    before(() =>
      clearTmpDir()
    );

    it('should say dir doesn\'t exist', () => {
      var preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: true,
        exists: false,
        files: 0
      })
    });
  });

});
