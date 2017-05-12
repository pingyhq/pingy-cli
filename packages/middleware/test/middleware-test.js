'use strict';

var Path = require('path');
var expect = require('unexpected')
  .clone()
  .installPlugin(require('unexpected-express'))
  .installPlugin(require('unexpected-sinon'));
var connect = require('connect');
var sinon = require('sinon');
var pitm = require('../lib/middleware');
var babyTolk = require('@pingy/compile');
var fs = require('fs');

function getPath(path) {
  return Path.join(process.cwd(), 'examples/site', path || '');
}

describe('middleware', () => {
  var app;
  var compileCount = 0;
  var cssFileChanged = 0;
  var cssFileChangedExpectation = 0;

  var startup = function () {
    var pitmInstance = pitm(getPath());
    app = connect().use(pitmInstance);

    pitmInstance.events.on('fileChanged', (serverPath, sourcePath) => {
      if (
        serverPath === '/styles/main.css' &&
        (sourcePath === 'styles/main.styl' || sourcePath === 'styles/headings.styl')
      ) {
        cssFileChanged += 1;
      }
    });
  };

  before(() => {
    startup();

    // babyTolk.read is called on compile so spy on this to see if
    // compilation has taken place
    babyTolk.read = sinon.spy(babyTolk, 'read');
  });

  function expectCssFileChangedEvent() {
    cssFileChangedExpectation += 1;
    return expect(cssFileChanged, 'to be', cssFileChangedExpectation);
  }

  function expectCompiled() {
    compileCount += 1;
    return expect(babyTolk.read, 'was called times', compileCount);
  }

  function expectCached() {
    return expect(babyTolk.read, 'was called times', compileCount);
  }

  describe('inner source file added after startup', () => {
    var pathToCSS = getPath('styles/main.styl');
    var fileContentsCSS;
    var importRemovedCSS;

    before((done) => {
      fs.readFile(pathToCSS, (err, contents) => {
        fileContentsCSS = contents;

        importRemovedCSS = fileContentsCSS.toString().split('\n'); // split into lines
        importRemovedCSS.shift(); // remove first line
        importRemovedCSS = importRemovedCSS.join('\n'); // join up the string again
        fs.writeFile(pathToCSS, importRemovedCSS, () => {
          done();
        });
      });
    });

    it('should compile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('not to contain', 'h1 {'),
        },
      }).then(() => expectCompiled()));

    it('should have styl sourcemap', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: {
            sources: ['/styles/main.styl'],
            mappings: expect.it('to be non-empty'),
          },
        },
      }).then(() => expectCached())); // Loading source files also caches source map

    describe('add inner import', () => {
      before((done) => {
        // Revert file back to original contents with import
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, fileContentsCSS, () => setTimeout(done, 250));
      });

      it('should compile styl file', () =>
        expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css' },
          response: {
            headers: {
              'Content-Type': 'text/css; charset=UTF-8',
              'X-SourceMap': 'main.css.map',
            },
            body: expect.it('to contain', 'h1 {'),
          },
        }).then(() => expectCompiled()));

      it('should have styl sourcemap', () =>
        expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css.map' },
          response: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: {
              sources: ['/styles/headings.styl', '/styles/main.styl'],
              mappings: expect.it('to be non-empty'),
            },
          },
        }).then(() => expectCached()));

      it('should cause a file change event', () => expectCssFileChangedEvent());

      describe('edit inner import file', () => {
        var pathToInnerCSS = getPath('styles/headings.styl');
        var fileContentsInnerCSS;

        before((done) => {
          fs.readFile(pathToInnerCSS, (err, contents) => {
            fileContentsInnerCSS = contents;
            var newContents = `${contents}\nh2\n  color blue`;

            fs.writeFile(pathToInnerCSS, newContents, () => setTimeout(done, 250));
          });
        });

        after((done) => {
          // Revert file back to original contents with import
          // Allow 250ms for chokidar to notice the change
          fs.writeFile(pathToInnerCSS, fileContentsInnerCSS, () => setTimeout(done, 250));
        });

        it('should compile styl file', () =>
          expect(app, 'to yield exchange', {
            request: { url: '/styles/main.css' },
            response: {
              headers: {
                'Content-Type': 'text/css; charset=UTF-8',
                'X-SourceMap': 'main.css.map',
              },
              body: expect.it('to contain', 'h2 {'),
            },
          }).then(() => expectCompiled()));

        it('should cause a file change event', () => expectCssFileChangedEvent());
      });

      describe('after cleanup', () => {
        it('should cause a file change event', () => expectCssFileChangedEvent());
      });
    });
  });

  describe('first requests', () => {
    it('should compile jade file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>'),
        },
      }).then(() => expectCompiled()));

    it('should compile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'h1 {'),
        },
      }).then(() => expectCompiled()));

    it('should have styl sourcemap', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: {
            sources: ['/styles/headings.styl', '/styles/main.styl'],
            mappings: expect.it('to be non-empty'),
          },
        },
      }).then(() => expectCached())); // Loading source files also caches source map

    it('should compile coffee file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript; charset=UTF-8',
            'X-SourceMap': 'main.js.map',
          },
          body: expect.it('to contain', 'console.log('),
        },
      }).then(() => expectCompiled()));

    it('should have coffee sourcemap', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: {
            sources: ['/scripts/main.coffee'],
            mappings: expect.it('to be non-empty'),
          },
        },
      }).then(() => expectCached())); // Loading source files also caches source map
  });

  describe('second (cached) requests', () => {
    it('should *not* compile jade file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>'),
        },
      }).then(() => expectCached()));

    it('should *not* compile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCached()));

    it('should *not* compile coffee file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript; charset=UTF-8',
            'X-SourceMap': 'main.js.map',
          },
          body: expect.it('to contain', 'console.log('),
        },
      }).then(() => expectCached()));
  });

  describe('third requests (after editing a watched file)', () => {
    var pathToCSS = getPath('styles/main.styl');
    var fileContents;

    before((done) => {
      fs.readFile(pathToCSS, (err, contents) => {
        fileContents = contents;
        // Add space to end of file
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, `${contents} `, () => setTimeout(done, 250));
      });
    });

    after((done) => {
      // Revert file back to original contents
      // Allow 250ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContents, () => setTimeout(done, 250));
    });

    it('should recompile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCompiled()));

    it('should cause a file change event', () => expectCssFileChangedEvent());
  });

  describe('fourth requests', () => {
    // Probably bit pointless doing this again but just in case
    it('should recompile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCompiled()));

    it('should cause a file change event', () => expectCssFileChangedEvent());
  });

  describe('fifth (cached) requests', () => {
    // Probably bit pointless doing this again but just in case
    it('should *not* compile styl file', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCached()));

    it('should *not* cause a file change event', () =>
      expect(cssFileChangedExpectation, 'to be', cssFileChanged));
  });

  describe('errors', () => {
    var pathToCSS = getPath('styles/main.styl');
    var pathToJS = getPath('scripts/main.coffee');
    var fileContentsCSS;
    var fileContentsJS;

    before((done) => {
      var numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done();
      }
      fs.readFile(pathToCSS, (err, contents) => {
        fileContentsCSS = contents;
        // Add space to end of file
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, 'sodifj5ij%$:@', () => setTimeout(halfDone, 250));
      });
      fs.readFile(pathToJS, (err, contents) => {
        fileContentsJS = contents;
        fs.writeFile(pathToJS, '"sodifj5ij%$:@', halfDone);
      });
    });

    after((done) => {
      var numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done();
      }
      // Revert file back to original contents
      // Allow 250ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContentsCSS, () => setTimeout(done, 250));
      fs.writeFile(pathToJS, fileContentsJS, halfDone);
    });

    it('should return 404 when file not found', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/foo/bar.css' },
        response: {
          statusCode: 404,
          body: expect.it('to be undefined'),
        },
      }));

    it('should output error on css error', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'ParseError'),
        },
      }));

    it('should output error on js error', () =>
      expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'error: missing'),
        },
      }));
  });
});
