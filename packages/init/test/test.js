/* jshint esnext: true */

'use strict';

const expect = require('unexpected').clone();
const barnyard = require('../');
const Path = require('path');
const rimraf = require('rimraf');
const _mkdirp = require('mkdirp');
const walk = require('./helpers').walk;
const Q = require('q');
const fs = require('fs');
const readFile = Q.denodeify(fs.readFile);
const writeFile = Q.denodeify(fs.writeFile);
const mkdirp = Q.denodeify(_mkdirp);
const { join } = Path;

describe('barnyard', () => {
  const tmpDir = Path.join(process.cwd(), 'tmp/');
  const scriptsDir = Path.join(tmpDir, 'scripts/');
  const stylesDir = Path.join(tmpDir, 'styles/');

  const makeRelative = files => files.map(file => file && file.replace(tmpDir, ''));
  const _clearTmpDir = cb => mkdirp(tmpDir).then(() => rimraf(tmpDir, cb));
  const clearTmpDir = Q.denodeify(_clearTmpDir);

  after(clearTmpDir);

  describe('vanilla scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      const options = {};
      const barn = barnyard(tmpDir, options);

      return barn.then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.html',
          join('scripts', 'main.js'),
          join('styles', 'main.css')
        ).and('to have length', 3)
      );
    });

    it('should contain correct files', () => {
      return walk(tmpDir).then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.html',
          join('scripts', 'main.js'),
          join('styles', 'main.css')
        ).and('to have length', 3)
      );
    });

    describe('index.html', () => {
      const filePath = Path.join(tmpDir, 'index.html');
      let fileContents;
      before(() => {
        return readFile(filePath, 'utf8').then(data => (fileContents = data));
      });

      it('should reference scripts and styles', () => {
        return expect(fileContents, 'to contain', 'main.css', 'main.js');
      });

      it('should not reference babel polyfill or normalize', () => {
        return expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css');
      });
    });

    describe('asset files', () => {
      it('should have contents', () => {
        const jsPath = Path.join(scriptsDir, 'main.js');
        const cssPath = Path.join(stylesDir, 'main.css');
        return Q.all([readFile(jsPath, 'utf8'), readFile(cssPath, 'utf8')]).then(files =>
          files.forEach(file => expect(file.length, 'to be greater than', 10))
        );
      });
    });
  });

  describe('jade, scss & coffee scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      const options = {
        html: {
          type: 'jade',
        },
        styles: {
          type: 'scss',
        },
        scripts: {
          type: 'coffee',
        },
      };
      const barn = barnyard(tmpDir, options);

      return barn.then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.jade',
          join('scripts', 'main.coffee'),
          join('styles', 'main.scss')
        ).and('to have length', 3)
      );
    });

    it('should contain correct files', () => {
      return walk(tmpDir).then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.jade',
          join('scripts', 'main.coffee'),
          join('styles', 'main.scss')
        ).and('to have length', 3)
      );
    });

    describe('index.jade', () => {
      const filePath = Path.join(tmpDir, 'index.jade');
      let fileContents;
      before(() => {
        return readFile(filePath, 'utf8').then(data => (fileContents = data));
      });

      it('should reference scripts and styles', () => {
        return expect(fileContents, 'to contain', 'main.css', 'main.js');
      });

      it('should not reference babel polyfill or normalize', () => {
        return expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css');
      });
    });

    describe('asset files', () => {
      it('should have contents', () => {
        const coffeePath = Path.join(scriptsDir, 'main.coffee');
        const scssPath = Path.join(stylesDir, 'main.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')]).then(files =>
          files.forEach(file => expect(file.length, 'to be greater than', 10))
        );
      });
    });
  });

  describe('include babel polyfill + normalize', () => {
    describe('with html index', () => {
      before(clearTmpDir);
      it('should complete successfully', () => {
        const options = {
          babelPolyfill: true,
          normalizeCss: true,
          html: {
            type: 'html',
          },
          scripts: {
            type: 'babel',
          },
        };
        const barn = barnyard(tmpDir, options);

        return barn.then(files =>
          expect(
            makeRelative(files),
            'to contain',
            'index.html',
            join('scripts', 'main.babel.js'),
            join('styles', 'main.css'),
            join('scripts', 'polyfill.js'),
            join('styles', 'normalize.css'),
            '.babelrc'
          ).and('to have length', 6)
        );
      });

      it('should have correct references', () => {
        const filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', 'polyfill.js', 'normalize.css')
        );
      });

      it('should have correct files', () => {
        const pFilePath = Path.join(scriptsDir, 'polyfill.js');
        const nFilePath = Path.join(stylesDir, 'normalize.css');
        const pFile = readFile(pFilePath, 'utf8');
        const nFile = readFile(nFilePath, 'utf8');

        return Q.all([pFile, nFile]).then((files) => {
          expect(files[0], 'to contain', 'babelPolyfill');
          expect(files[1], 'to contain', '/*! normalize.css');
        });
      });
    });

    describe('with jade index', () => {
      before(clearTmpDir);
      it('should complete successfully', () => {
        const options = {
          babelPolyfill: true,
          normalizeCss: true,
          html: {
            type: 'jade',
          },
          scripts: {
            type: 'babel',
          },
        };
        const barn = barnyard(tmpDir, options);

        return barn.then(files =>
          expect(
            makeRelative(files),
            'to contain',
            'index.jade',
            join('scripts', 'main.babel.js'),
            join('styles', 'main.css'),
            join('scripts', 'polyfill.js'),
            join('styles', 'normalize.css'),
            '.babelrc'
          ).and('to have length', 6)
        );
      });

      it('should have correct references', () => {
        const filePath = Path.join(tmpDir, 'index.jade');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', 'polyfill.js', 'normalize.css')
        );
      });

      it('should have correct files', () => {
        const pFilePath = Path.join(scriptsDir, 'polyfill.js');
        const nFilePath = Path.join(stylesDir, 'normalize.css');
        const bFilePath = Path.join(tmpDir, '.babelrc');
        const pFile = readFile(pFilePath, 'utf8');
        const nFile = readFile(nFilePath, 'utf8');
        const bFile = readFile(bFilePath, 'utf8');

        return Q.all([pFile, nFile, bFile]).then((files) => {
          expect(files[0], 'to contain', 'babelPolyfill');
          expect(files[1], 'to contain', '/*! normalize.css');
          expect(files[2], 'to contain', '"presets": ["env"]');
        });
      });
    });
  });

  describe('jade, scss & coffee scaffold', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      const options = {
        styles: {
          type: 'scss',
        },
        html: {
          type: 'jade',
        },
        scripts: {
          type: 'coffee',
        },
      };
      const barn = barnyard(tmpDir, options);

      return barn.then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.jade',
          join('scripts', 'main.coffee'),
          join('styles', 'main.scss')
        ).and('to have length', 3)
      );
    });

    it('should contain correct files', () => {
      return walk(tmpDir).then(files =>
        expect(
          makeRelative(files),
          'to contain',
          'index.jade',
          join('scripts', 'main.coffee'),
          join('styles', 'main.scss')
        ).and('to have length', 3)
      );
    });

    describe('index.jade', () => {
      const filePath = Path.join(tmpDir, 'index.jade');
      let fileContents;
      before(() => {
        return readFile(filePath, 'utf8').then(data => (fileContents = data));
      });

      it('should reference scripts and styles', () => {
        return expect(fileContents, 'to contain', 'main.css', 'main.js');
      });

      it('should not reference babel polyfill or normalize', () => {
        return expect(fileContents, 'not to contain', 'polyfill.js', 'normalize.css');
      });
    });

    describe('asset files', () => {
      it('should have contents', () => {
        const coffeePath = Path.join(scriptsDir, 'main.coffee');
        const scssPath = Path.join(stylesDir, 'main.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')]).then(files =>
          files.forEach(file => expect(file.length, 'to be greater than', 10))
        );
      });
    });
  });

  describe('Rename output files', () => {
    before(clearTmpDir);
    it('should complete successfully', () => {
      const options = {
        babelPolyfill: true,
        normalizeCss: true,
        styles: {
          type: 'scss',
          folder: 'css',
          file: 'styles',
        },
        html: {
          type: 'jade',
          file: '200',
        },
        scripts: {
          type: 'coffee',
          file: 'app',
          folder: 'js',
        },
      };
      const barn = barnyard(tmpDir, options);

      return barn.then(files =>
        expect(
          makeRelative(files),
          'to contain',
          '200.jade',
          join('js', 'app.coffee'),
          join('css', 'styles.scss'),
          join('js', 'polyfill.js'),
          join('css', 'normalize.css')
        ).and('to have length', 5)
      );
    });

    it('should contain correct files', () => {
      return walk(tmpDir).then(files =>
        expect(
          makeRelative(files),
          'to contain',
          '200.jade',
          join('js', 'app.coffee'),
          join('css', 'styles.scss'),
          join('js', 'polyfill.js'),
          join('css', 'normalize.css')
        ).and('to have length', 5)
      );
    });

    describe('index.jade', () => {
      const filePath = Path.join(tmpDir, '200.jade');
      let fileContents;
      before(() => {
        return readFile(filePath, 'utf8').then(data => (fileContents = data));
      });

      it('should reference scripts and styles', () => {
        return expect(fileContents, 'to contain', 'css/styles.css', 'js/app.js');
      });

      it('should reference babel polyfill or normalize', () => {
        return expect(fileContents, 'to contain', 'js/polyfill.js', 'css/normalize.css');
      });
    });

    describe('asset files', () => {
      it('should have contents', () => {
        const coffeePath = Path.join(Path.join(tmpDir, 'js'), 'app.coffee');
        const scssPath = Path.join(Path.join(tmpDir, 'css'), 'styles.scss');
        return Q.all([readFile(coffeePath, 'utf8'), readFile(scssPath, 'utf8')]).then(files =>
          files.forEach(file => expect(file.length, 'to be greater than', 10))
        );
      });
    });
  });

  describe('whitespace', () => {
    describe('tabs', () => {
      before(clearTmpDir);

      it('should complete successfully', () => {
        return barnyard(tmpDir, { whitespaceFormatting: 'tabs' }).then(files =>
          expect(makeRelative(files), 'to have length', 3)
        );
      });

      it('should have correct references', () => {
        const filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n\t<').and('not to contain', '  ')
        );
      });
    });

    describe('2 spaces', () => {
      before(clearTmpDir);

      it('should complete successfully', () => {
        return barnyard(tmpDir, { whitespaceFormatting: 2 }).then(files =>
          expect(makeRelative(files), 'to have length', 3)
        );
      });

      it('should have correct references', () => {
        const filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n  <').and('not to contain', '\t')
        );
      });
    });

    describe('4 spaces', () => {
      before(clearTmpDir);

      it('should complete successfully', () => {
        return barnyard(tmpDir, { whitespaceFormatting: 4 }).then(files =>
          expect(makeRelative(files), 'to have length', 3)
        );
      });

      it('should have correct references', () => {
        const filePath = Path.join(tmpDir, 'index.html');
        return readFile(filePath, 'utf8').then(data =>
          expect(data, 'to contain', '\n    <').and('not to contain', '\n  <')
        );
      });
    });
  });

  describe('preflight (not empty)', () => {
    before(() => {
      return clearTmpDir().then(() =>
        mkdirp(tmpDir).then(() => writeFile(Path.join(tmpDir, 'helloworld.txt'), 'Hello World!'))
      );
    });

    it('should warn that dir is not empty', () => {
      const preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: false,
        exists: true,
        files: 1,
      });
    });
  });

  describe('preflight (empty)', () => {
    before(() => {
      return clearTmpDir().then(() => mkdirp(tmpDir));
    });

    it('should say dir is empty', () => {
      const preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: true,
        exists: true,
        files: 0,
      });
    });
  });

  describe('preflight (empty with prepare options)', () => {
    before(() => {
      return clearTmpDir().then(() => mkdirp(tmpDir));
    });

    it('should say dir is empty', () => {
      const preflight = barnyard.preflight(tmpDir, {
        babelPolyfill: true,
        normalizeCss: true,
        html: {
          type: 'html',
        },
        scripts: {
          type: 'babel',
        },
      });
      return expect(preflight, 'to be fulfilled with', {
        empty: true,
        exists: true,
        files: 0,
        preparedFiles: expect
          .it(
            'to contain',
            join(tmpDir, 'index.html'),
            join(tmpDir, '.babelrc'),
            join(tmpDir, 'scripts', 'main.babel.js'),
            join(tmpDir, 'styles', 'main.css'),
            join(tmpDir, 'scripts', 'polyfill.js'),
            join(tmpDir, 'styles', 'normalize.css')
          )
          .and('to have length', 6),
      });
    });
  });

  describe('preflight (non-exist)', () => {
    before(() => {
      return clearTmpDir();
    });

    it("should say dir doesn't exist", () => {
      const preflight = barnyard.preflight(tmpDir);
      return expect(preflight, 'to be fulfilled with', {
        empty: true,
        exists: false,
        files: 0,
      });
    });
  });
});
