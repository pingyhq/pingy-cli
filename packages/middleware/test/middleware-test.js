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

describe('middleware', function() {
  var app;
  var compileCount = 0;
  var cssFileChanged = 0;
  var cssFileChangedExpectation = 0;

  var startup = function() {
    var pitmInstance = pitm(getPath());
    app = connect().use(pitmInstance);

    pitmInstance.events.on('fileChanged', function(serverPath, sourcePath) {
      if ((serverPath === '/styles/main.css') &&
          (sourcePath === 'styles/main.styl' || sourcePath === 'styles/headings.styl')) {
        cssFileChanged = cssFileChanged + 1;
      }
    });
  };

  before(function() {
    startup();

    // babyTolk.read is called on compile so spy on this to see if
    // compilation has taken place
    babyTolk.read = sinon.spy(babyTolk, 'read');
  });

  function expectCssFileChangedEvent() {
    cssFileChangedExpectation = cssFileChangedExpectation + 1;
    return expect(cssFileChanged, 'to be', cssFileChangedExpectation);
  }

  function expectCompiled() {
    compileCount = compileCount + 1;
    return expect(babyTolk.read, 'was called times', compileCount);
  }

  function expectCached() {
    return expect(babyTolk.read, 'was called times', compileCount);
  }

  describe('inner source file added after startup', function() {
    var pathToCSS = getPath('styles/main.styl');
    var fileContentsCSS;
    var importRemovedCSS;

    before(function(done) {
      fs.readFile(pathToCSS, function (err, contents) {
        fileContentsCSS = contents;

        importRemovedCSS = fileContentsCSS.toString().split('\n'); // split into lines
        importRemovedCSS.shift(); // remove first line
        importRemovedCSS = importRemovedCSS.join('\n'); // join up the string again
        fs.writeFile(pathToCSS, importRemovedCSS, function() {
          done();
        });
      });
    });

    it('should compile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('not to contain', 'h1 {')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should have styl sourcemap', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            sources: ['/styles/main.styl'],
            mappings: expect.it('to be non-empty')
          }
        }
      }).then(function() {
        return expectCached();
      }); // Loading source files also caches source map
    });

    describe('add inner import', function() {
      before(function (done) {
        // Revert file back to original contents with import
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, fileContentsCSS, function() {
          return setTimeout(done, 250);
        });
      });

      it('should compile styl file', function() {
        return expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css' },
          response: {
            headers: {
              'Content-Type': 'text/css; charset=UTF-8',
              'X-SourceMap': 'main.css.map'
            },
            body: expect.it('to contain', 'h1 {')
          }
        }).then(function() {
          return expectCompiled();
        });
      });

      it('should have styl sourcemap', function() {
        return expect(app, 'to yield exchange', {
          request: { url: '/styles/main.css.map' },
          response: {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              sources: ['/styles/headings.styl', '/styles/main.styl'],
              mappings: expect.it('to be non-empty')
            }
          }
        }).then(function() {
          return expectCached();
        });
      });

      it('should cause a file change event', function() {
        return expectCssFileChangedEvent();
      });

      describe('edit inner import file', function() {
        var pathToInnerCSS = getPath('styles/headings.styl');
        var fileContentsInnerCSS;

        before(function(done) {
          fs.readFile(pathToInnerCSS, function (err, contents) {
            fileContentsInnerCSS = contents;
            var newContents = contents + '\nh2\n  color blue';

            fs.writeFile(pathToInnerCSS, newContents, function() {
              return setTimeout(done, 250);
            });
          });
        });

        after(function (done) {
          // Revert file back to original contents with import
          // Allow 250ms for chokidar to notice the change
          fs.writeFile(pathToInnerCSS, fileContentsInnerCSS, function() {
            return setTimeout(done, 250);
          });
        });

        it('should compile styl file', function() {
          return expect(app, 'to yield exchange', {
            request: { url: '/styles/main.css' },
            response: {
              headers: {
                'Content-Type': 'text/css; charset=UTF-8',
                'X-SourceMap': 'main.css.map'
              },
              body: expect.it('to contain', 'h2 {')
            }
          }).then(function() {
            return expectCompiled();
          });
        });

        it('should cause a file change event', function() {
          return expectCssFileChangedEvent();
        });

      });

      describe('after cleanup', function() {
        it('should cause a file change event', function() {
          return expectCssFileChangedEvent();
        });
      });

    });

  });


  describe('first requests', function() {

    it('should compile jade file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'text/html; charset=UTF-8'
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should compile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'h1 {')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should have styl sourcemap', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            sources: ['/styles/headings.styl', '/styles/main.styl'],
            mappings: expect.it('to be non-empty')
          }
        }
      }).then(function() {
        return expectCached();
      }); // Loading source files also caches source map
    });

    it('should compile coffee file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript',
            'X-SourceMap': 'main.js.map'
          },
          body: expect.it('to contain', 'console.log(')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should have coffee sourcemap', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js.map' },
        response: {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            sources: ['/scripts/main.coffee'],
            mappings: expect.it('to be non-empty')
          }
        }
      }).then(function() {
        return expectCached();
      }); // Loading source files also caches source map
    });
  });

  describe('second (cached) requests', function() {

    it('should *not* compile jade file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/' },
        response: {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8'
          },
          body: expect.it('to contain', '<h1>Piggy In The Middle</h1>')
        }
      }).then(function() {
        return expectCached();
      });
    });

    it('should *not* compile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'body {')
        }
      }).then(function() {
        return expectCached();
      });
    });

    it('should *not* compile coffee file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        response: {
          headers: {
            'Content-Type': 'application/javascript',
            'X-SourceMap': 'main.js.map'
          },
          body: expect.it('to contain', 'console.log(')
        }
      }).then(function() {
        return expectCached();
      });
    });
  });

  describe('third requests (after editing a watched file)', function() {
    var pathToCSS = getPath('styles/main.styl');
    var fileContents;

    before(function (done) {
      fs.readFile(pathToCSS, function (err, contents) {
        fileContents = contents;
        // Add space to end of file
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, contents + ' ', function() {
          return setTimeout(done, 250);
        });
      });
    });

    after(function (done) {
      // Revert file back to original contents
      // Allow 250ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContents, function() {
        return setTimeout(done, 250);
      });
    });

    it('should recompile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'body {')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should cause a file change event', function() {
      return expectCssFileChangedEvent();
    });

  });

  describe('fourth requests', function() {

    // Probably bit pointless doing this again but just in case
    it('should recompile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'body {')
        }
      }).then(function() {
        return expectCompiled();
      });
    });

    it('should cause a file change event', function() {
      return expectCssFileChangedEvent();
    });
  });

  describe('fifth (cached) requests', function() {
    // Probably bit pointless doing this again but just in case
    it('should *not* compile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'body {')
        }
      }).then(function() {
        return expectCached();
      });
    });

    it('should *not* cause a file change event', function() {
      return expect(cssFileChangedExpectation, 'to be', cssFileChanged);
    });
  });

  describe('errors', function() {
    var pathToCSS = getPath('styles/main.styl');
    var pathToJS = getPath('scripts/main.coffee');
    var fileContentsCSS;
    var fileContentsJS;

    before(function (done) {
      var numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done()
      }
      fs.readFile(pathToCSS, function (err, contents) {
        fileContentsCSS = contents;
        // Add space to end of file
        // Allow 250ms for chokidar to notice the change
        fs.writeFile(pathToCSS, 'sodifj5ij%$:@', function() {
          return setTimeout(halfDone, 250);
        });
      });
      fs.readFile(pathToJS, function (err, contents) {
        fileContentsJS = contents;
        fs.writeFile(pathToJS, '"sodifj5ij%$:@', halfDone);
      });
    });

    after(function (done) {
      var numDone = 0;
      function halfDone() {
        numDone++;
        if (numDone === 2) done()
      }
      // Revert file back to original contents
      // Allow 250ms for chokidar to notice the change
      fs.writeFile(pathToCSS, fileContentsCSS, function() {
        return setTimeout(done, 250);
      });
      fs.writeFile(pathToJS, fileContentsJS, halfDone);
    });

    it('should return 404 when file not found', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/foo/bar.css' },
        response: {
          statusCode: 404,
          body: expect.it('to be undefined')
        }
      });
    });

    it('should output error on css error', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'ParseError')
        }
      });
    });

    it('should output error on js error', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/scripts/main.js' },
        headers: expect.it('to not have keys', 'X-SourceMap'),
        response: {
          statusCode: 200,
          body: expect.it('to contain', 'body * {').and('to contain', 'error: missing')
        }
      });
    });

  });

});
