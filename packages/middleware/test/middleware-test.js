'use strict';

const Path = require('upath');
const expect = require('unexpected')
  .clone()
  .installPlugin(require('unexpected-express'))
  .installPlugin(require('unexpected-sinon'));
const connect = require('connect');
const sinon = require('sinon');
const pitm = require('../lib/middleware');
const babyTolk = require('@pingy/compile');
const fs = require('fs');

function getPath(path) {
  return Path.join(process.cwd(), 'examples', 'site', path || '');
}

describe('middleware', function () {
  this.timeout(5000);
  let app;
  let compileCount = 0;
  let cssFileChanged = 0;
  let cssFileChangedExpectation = 0;

  const startup = function () {
    const pitmInstance = pitm(getPath());
    app = connect().use(pitmInstance);

    pitmInstance.events.on('fileChanged', (serverPath, sourcePath) => {
      if (
        serverPath === '/styles/main.css' &&
        (sourcePath === 'styles/main.styl' || sourcePath === 'styles/_headings.styl')
      ) {
        cssFileChanged += 1;
      }
    });
  };

  before(() => {
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
    const pathToCSS = getPath('styles/main.styl');
    let fileContentsCSS;
    let importRemovedCSS;

    before(function(done) {
      fs.readFile(pathToCSS, (err, contents) => {
        fileContentsCSS = contents;

        importRemovedCSS = fileContentsCSS.toString().split('\n'); // split into lines
        importRemovedCSS.shift(); // remove first line
        importRemovedCSS = importRemovedCSS.join('\n'); // join up the string again
        fs.writeFile(pathToCSS, importRemovedCSS, () => {
          startup();
          done();
        });
      });
    });

    it('should compile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('not to contain', 'h1 {'),
        },
      }).then(() => expectCompiled());
    });

    it('should have styl sourcemap', () => {
      return expect(app, 'to yield exchange', {
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
      }).then(() => expectCached());
    }); // Loading source files also caches source map

    describe('add inner import', () => {
      before(function(done) {
        // Revert file back to original contents with import
        // Allow 2000ms for chokidar to notice the change
        fs.writeFile(pathToCSS, fileContentsCSS, () => setTimeout(done, 2000));
      });

      it('should cause a file change event', () => {
        return expectCssFileChangedEvent();
      });

      it('should compile styl file', () => {
        return expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css' },
          response: {
            headers: {
              'Content-Type': 'text/css; charset=UTF-8',
              'X-SourceMap': 'main.css.map',
            },
            body: expect.it('to contain', 'h1 {'),
          },
        }).then(() => expectCompiled());
      });

      it('should have styl sourcemap', () => {
        return expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css.map' },
          response: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: {
              sources: expect.it('to contain', '/styles/_headings.styl', '/styles/main.styl'),
              mappings: expect.it('to be non-empty'),
            },
          },
        }).then(() => expectCached());
      });

      describe('edit inner import file', () => {
        const pathToInnerCSS = getPath('styles/_headings.styl');
        let fileContentsInnerCSS;

        before(function(done) {
          fs.readFile(pathToInnerCSS, (err, contents) => {
            fileContentsInnerCSS = contents;
            const newContents = `${contents}\nh2\n  color blue`;

            fs.writeFile(pathToInnerCSS, newContents, () => setTimeout(done, 2000));
          });
        });

        after(function(done) {
          // Revert file back to original contents with import
          // Allow 2000ms for chokidar to notice the change
          fs.writeFile(pathToInnerCSS, fileContentsInnerCSS, () => setTimeout(done, 2000));
        });

        it('should compile styl file', () => {
          return expect(app, 'to yield exchange', {
            request: { url: '/styles/main.css' },
            response: {
              headers: {
                'Content-Type': 'text/css; charset=UTF-8',
                'X-SourceMap': 'main.css.map',
              },
              body: expect.it('to contain', 'h2 {'),
            },
          }).then(() => expectCompiled());
        });

        it('should cause a file change event', () => {
          return expectCssFileChangedEvent();
        });
      });

      describe('after cleanup', () => {
        it('should cause a file change event', () => {
          return expectCssFileChangedEvent();
        });
      });
    });
  });

  describe('first requests', () => {
    it('should compile jade file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>'),
        },
      }).then(() => expectCompiled());
    });

    it('should compile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'h1 {'),
        },
      }).then(() => expectCompiled());
    });

    it('should have styl sourcemap', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
          },
          body: {
            sources: expect.it('to contain', '/styles/_headings.styl', '/styles/main.styl'),
            mappings: expect.it('to be non-empty'),
          },
        },
      }).then(() => expectCached());
    }); // Loading source files also caches source map

    it('should compile coffee file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript; charset=UTF-8',
            'X-SourceMap': 'main.js.map',
          },
          body: expect.it('to contain', 'console.log('),
        },
      }).then(() => expectCompiled());
    });

    it('should have coffee sourcemap', () => {
      return expect(app, 'to yield exchange', {
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
      }).then(() => expectCached());
    }); // Loading source files also caches source map
  });

  describe('second (cached) requests', () => {
    it('should *not* compile jade file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>'),
        },
      }).then(() => expectCached());
    });

    it('should *not* compile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCached());
    });

    it('should *not* compile coffee file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript; charset=UTF-8',
            'X-SourceMap': 'main.js.map',
          },
          body: expect.it('to contain', 'console.log('),
        },
      }).then(() => expectCached());
    });
  });

  describe('third requests (after editing a watched file)', () => {
    const pathToCSS = getPath('styles/main.styl');
    let fileContents;

    before(function(done) {
      fs.readFile(pathToCSS, (err, contents) => {
        fileContents = contents;
        // Add space to end of file
        // Allow 2000ms for chokidar to notice the change
        fs.writeFile(pathToCSS, `${contents} `, () => setTimeout(done, 2000));
      });
    });

    after(function(done) {
      // Revert file back to original contents
      // Allow 2000ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContents, () => setTimeout(done, 2000));
    });

    it('should recompile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCompiled());
    });

    it('should cause a file change event', () => {
      return expectCssFileChangedEvent();
    });
  });

  describe('fourth requests', () => {
    // Probably bit pointless doing this again but just in case
    it('should recompile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCompiled());
    });

    it('should cause a file change event', () => {
      return expectCssFileChangedEvent();
    });
  });

  describe('fifth (cached) requests', () => {
    // Probably bit pointless doing this again but just in case
    it('should *not* compile styl file', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map',
          },
          body: expect.it('to contain', 'body {'),
        },
      }).then(() => expectCached());
    });

    it('should *not* cause a file change event', () => {
      return expect(cssFileChangedExpectation, 'to be', cssFileChanged);
    });
  });

  describe('errors', () => {
    const pathToCSS = getPath('styles/main.styl');
    const pathToJS = getPath('scripts/main.coffee');
    let fileContentsCSS;
    let fileContentsJS;

    before(function(done) {
      let numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done();
      }
      fs.readFile(pathToCSS, (err, contents) => {
        fileContentsCSS = contents;
        // Add space to end of file
        // Allow 2000ms for chokidar to notice the change
        fs.writeFile(pathToCSS, 'sodifj5ij%$:@', () => setTimeout(halfDone, 2000));
      });
      fs.readFile(pathToJS, (err, contents) => {
        fileContentsJS = contents;
        fs.writeFile(pathToJS, '"sodifj5ij%$:@', halfDone);
      });
    });

    after(function(done) {
      let numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done();
      }
      // Revert file back to original contents
      // Allow 2000ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContentsCSS, () => setTimeout(done, 2000));
      fs.writeFile(pathToJS, fileContentsJS, halfDone);
    });

    it('should return 404 when file not found', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/foo/bar.css' },
        response: {
          statusCode: 404,
          body: expect.it('to be undefined'),
        },
      });
    });

    it('should output error on css error', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'ParseError'),
        },
      });
    });

    it('should output error on js error', () => {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'error: missing'),
        },
      });
    });
  });
});
