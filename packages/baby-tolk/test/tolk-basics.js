'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var tolk = require('../lib/baby-tolk');

function getPath(path) {
  return Path.join(process.cwd(), 'fixtures/source', path);
}

describe('readCompiled', function () {
  it('should read a file directly if there is no adapter', function () {
    return expect(tolk.read(getPath('unchanged.txt')), 'to be fulfilled with', {
      result: 'I am the same\n'
    });
  });

  it('should throw when reading a file that does not exist', function () {
    return expect(tolk.read(getPath('does-not-exist.txt')), 'when rejected', 'to satisfy', {
      code: 'ENOENT',
      path: /fixtures\/source\/does-not-exist\.txt$/,
      message: /^ENOENT.*?, open '.+?fixtures\/source\/does-not-exist\.txt'$/
    });
  });

  it('should compile a file if there is an adapter', function () {
    this.timeout(10000);
    // Babel config is in `fixtures/source/babel/.babelrc`
    return expect(tolk.read(getPath('babel/simplest.babel.js')), 'to be fulfilled with', {
      result: expect.it('to begin with', '\'use strict\';\n\nvar foo = \'bar\';'),
      extension: expect.it('to be', '.js'),
    });
  });

  it('should output source map if there is an adapter that supports source maps', function () {
    return expect(tolk.read(getPath('less/external.less')), 'to be fulfilled with', {
      sourcemap: {
        sources: expect.it('to have length', 2),
        mappings: expect.it('to begin with', 'AAAA;EACE,')
      }
    });
  });

  it('should have a fix for issue #1 (buggy uglifyJS2)', function () {
    return expect(tolk.read(getPath('coffee/basic.coffee'), {minify: true}), 'to be fulfilled with', {
      sourcemap: {
        sources: expect.it('to have length', 1),
        mappings: expect.it('to begin with', 'CAAA,WAAAA'),
        file: expect.it('to be', 'basic.js')
      }
    });
  });

  it('should support CSS minification (with compilation)', function () {
    return expect(tolk.read(getPath('less/external.less'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '.bar{wow:\'foo\'}'),
      sourcemap: {
        sources: expect.it('to have length', 2),
        mappings: expect.it('to begin with', 'AAAA,KACE,')
      }
    });
  });

  it('should support CSS minification (without compilation)', function () {
    return expect(tolk.read(getPath('csso/basic.css'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '/*! keep this comment */.hello{margin:0;color:silver'),
      sourcemap: {
        sources: expect.it('to have length', 1),
        mappings: expect.it('to begin with', 'wBAGA,OACE,')
      }
    });
  });

  it('should support JS minification (with compilation)', function () {
    return expect(tolk.read(getPath('coffee/basic.coffee'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '(function(){console.log(15)})'),
      sourcemap: {
        sources: expect.it('to have length', 1),
        mappings: expect.it('to begin with', 'CAAA,WAAAA')
      }
    });
  });

  it('should support JS minification (without compilation)', function () {
    return expect(tolk.read(getPath('minify-js/basic.js'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', 'for(var stuff=[1,2,3,4,5],i=0;i<stuff.length;i++)'),
      sourcemap: {
        sources: expect.it('to have length', 1),
        mappings: expect.it('to begin with', 'AACA,IAAK,')
      }
    });
  });


  it('should support HTML minification (with compilation)', function () {
    return expect(tolk.read(getPath('jade/client-complex.jade'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '<p>1</p><p>1</p><p>2</p><p>2</p><p>3</p><p>3</p><p>4</p><p>4</p><div class="1">')
    });
  });

  it('should support HTML minification (without compilation)', function () {
    return expect(tolk.read(getPath('minify-html/basic.html'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '<div class="foobar"><p>wowlaween</p><div>')
    });
  });

  it('should not compile files beginning with underscore', function () {
    return expect(tolk.read(getPath('scss/_mixin_lib.scss'), {minify: true}), 'to be fulfilled with', {
      result: expect.it('to begin with', '@mixin set_color($color) {\n  color: $color;')
    });
  });

  it('should throw when compiling a file that does not exist', function () {
    return expect(tolk.read(getPath('does-not-exist.scss')), 'when rejected', 'to satisfy', {
      code: 'ENOENT',
      path: /fixtures\/source\/does-not-exist\.scss$/,
      message: /^ENOENT.*?, open '.+?fixtures\/source\/does-not-exist\.scss'$/
    });
  });

  it('should throw when compiling a file with syntax errors', function () {
    return expect(tolk.read(getPath('scss/syntaxerror.scss')), 'when rejected', 'to satisfy', {
      status: 1,
      file: /fixtures\/source\/scss\/syntaxerror\.scss$/,
      line: 2,
      column: 3,
      message: 'property "color" must be followed by a \':\'',
    });
  });

});
