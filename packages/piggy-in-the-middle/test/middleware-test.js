'use strict';

var Path = require('path');
var expect = require('unexpected')
  .clone()
  .installPlugin(require('unexpected-express'))
  .installPlugin(require('unexpected-sinon'));
var connect = require('connect');
var sinon = require('sinon');
var pitm = require('../lib/piggy-in-the-middle');
var babyTolk = require('baby-tolk');
var fs = require('fs');


function getPath(path) {
  return Path.join(process.cwd(), 'examples/site', path || '');
}

describe('middleware', function () {


  var app;
  var compileCount = 0;

  before(function() {
    app = connect().use(pitm(getPath()));
    babyTolk.read = sinon.spy(babyTolk, 'read');
  });

  function expectCompiled() {
    compileCount = compileCount + 1;
    return expect(babyTolk.read, 'was called times', compileCount);
  }

  function expectCached() {
    return expect(babyTolk.read, 'was called times', compileCount);
  }

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
      }).then(() => expectCompiled());
    });

    it('should compile styl file', function() {
      return expect(app, 'to yield exchange', {
        request: { url: '/styles/main.css' },
        response: {
          headers: {
            'Content-Type': 'text/css; charset=UTF-8',
            'X-SourceMap': 'main.css.map'
          },
          body: expect.it('to contain', 'body {')
        }
      }).then(() => expectCompiled());
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
      }).then(() => expectCached()); // Loading source files also caches source map
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
      }).then(() => expectCompiled());
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
      }).then(() => expectCached()); // Loading source files also caches source map
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
      }).then(() => expectCached());
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
      }).then(() => expectCached());
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
      }).then(() => expectCached());
    });

  });

  describe('third requests (after editing source)', function() {
    var pathToCSS = getPath('styles/main.styl');
    var fileContents;

    before(function(done) {
      fs.readFile(pathToCSS, function(err, contents){
        fileContents = contents;
        fs.writeFile(pathToCSS, contents+' ', function() {
          setTimeout(done, 250); // Allow 250ms for chokidar to notice the change
        });
      });
    });

    after(function(done) {
      // Revert file back to original state
      fs.writeFile(pathToCSS, fileContents, done);
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
      }).then(() => expectCompiled());
    });

  });

});
