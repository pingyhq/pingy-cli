'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var tolk = require('../lib/baby-tolk');

function getPath(path) {
  return Path.join(process.cwd(), 'fixtures/source', path);
}

describe('readCompiled', () => {
  it('should read a file directly if there is no adapter', () =>
    expect(tolk.read(getPath('unchanged.txt')), 'to be fulfilled with', {
      result: 'I am the same\n',
      inputSha: expect.it('to be undefined'),
      outputSha: expect.it('to be undefined'),
      transformId: '::map',
    }));

  it('should read a file directly with same shas', () => {
    var sha = '0bafeaaee1ee07b2dd609aa0079bb1a6d07cb696';
    return expect(tolk.read(getPath('unchanged.txt'), { sha: true }), 'to be fulfilled with', {
      result: 'I am the same\n',
      inputSha: [{ file: getPath('unchanged.txt'), sha }],
      outputSha: sha,
      transformId: '::map',
    });
  });

  it('should throw when reading a file that does not exist', () =>
    expect(tolk.read(getPath('does-not-exist.txt')), 'when rejected', 'to satisfy', {
      code: 'ENOENT',
      path: /fixtures\/source\/does-not-exist\.txt$/,
      message: /^ENOENT.*?, open '.+?fixtures\/source\/does-not-exist\.txt'$/,
    }));

  it('should compile a file if there is an adapter', function () {
    this.timeout(10000);
    // Babel config is in `fixtures/source/babel/.babelrc`
    return expect(tolk.read(getPath('babel/simplest.babel.js')), 'to be fulfilled with', {
      result: expect.it('to begin with', "'use strict';\n\nvar foo = 'bar';"),
      extension: expect.it('to be', '.js'),
      inputSha: expect.it('to be undefined'),
      outputSha: expect.it('to be undefined'),
      transformId: expect.it('to contain', 'babel').and('to contain', 'map'),
    });
  });

  it('should compile a file if there is an adapter (with shas)', function () {
    this.timeout(10000);
    // Babel config is in `fixtures/source/babel/.babelrc`
    var sha = 'bb53426985e1692be8cd6e0374c3f8779407309e';
    return expect(
      tolk.read(getPath('babel/simplest.babel.js'), { sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', "'use strict';\n\nvar foo = 'bar';"),
        extension: expect.it('to be', '.js'),
        inputSha: [{ sha, file: getPath('babel/simplest.babel.js') }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect.it('to contain', 'babel').and('to contain', 'map'),
      }
    );
  });

  it('should output source map if there is an adapter that supports source maps', () => {
    var sha = '78a02ee68819713449fa99abede88c4e45ef0cb6';
    return expect(tolk.read(getPath('less/external.less'), { sha: true }), 'to be fulfilled with', {
      sourcemap: {
        sources: expect.it('to have length', 2),
        mappings: expect.it('to begin with', 'AAAA;EACE,'),
      },
      inputSha: [
        {
          file: expect.it('to contain', 'external.less'),
          sha,
        },
        {
          file: expect.it('to contain', '_import.less'),
          sha: 'a7a12083a1422a1d0eaaa30859061f0ed17d5fc3',
        }
      ],
      outputSha: expect.it('to have length', 40).and('not to equal', sha),
      transformId: expect.it('to contain', 'less').and('to contain', 'map'),
    });
  });

  it('should have a fix for issue #1 (buggy uglifyJS2)', () => {
    var sha = '416786ab8e37f3f35cd9daec8b1642510509fdb8';
    return expect(
      tolk.read(getPath('coffee/basic.coffee'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        sourcemap: {
          sources: expect.it('to have length', 1),
          mappings: expect.it('to begin with', 'CAAA,WAAAA'),
          file: expect.it('to be', 'basic.js'),
        },
        inputSha: [{ file: expect.it('to contain', 'basic.coffee'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect
          .it('to contain', 'coffee')
          .and('to contain', 'map')
          .and('to contain', 'minify'),
      }
    );
  });

  it('should support CSS minification (with compilation)', () => {
    var sha = '78a02ee68819713449fa99abede88c4e45ef0cb6';
    return expect(
      tolk.read(getPath('less/external.less'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', ".bar{wow:'foo'}"),
        sourcemap: {
          sources: expect.it('to have length', 2),
          mappings: expect.it('to begin with', 'AAAA,KACE,'),
        },
        inputSha: [
          { file: expect.it('to contain', 'external.less'), sha },
          {
            file: expect.it('to contain', '_import.less'),
            sha: 'a7a12083a1422a1d0eaaa30859061f0ed17d5fc3',
          }
        ],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect
          .it('to contain', 'less')
          .and('to contain', 'map')
          .and('to contain', 'minify'),
      }
    );
  });

  it('should support CSS minification + autoprefix (with compilation)', () => {
    var sha = '78a02ee68819713449fa99abede88c4e45ef0cb6';
    return expect(
      tolk.read(getPath('less/external.less'), { minify: true, sha: true, autoprefix: true }),
      'to be fulfilled with',
      {
        result: expect.it(
          'to begin with',
          ".bar{wow:'foo'}.foo{color:red;display:-webkit-box;display:-ms-flexbox;display:flex}"
        ),
        sourcemap: {
          sources: expect.it('to have length', 2),
          mappings: expect.it('to begin with', 'AAAA,KACE,'),
        },
        inputSha: [
          { file: expect.it('to contain', 'external.less'), sha },
          {
            file: expect.it('to contain', '_import.less'),
            sha: 'a7a12083a1422a1d0eaaa30859061f0ed17d5fc3',
          }
        ],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect
          .it('to contain', 'less')
          .and('to contain', 'map')
          .and('to contain', 'minify'),
      }
    );
  });

  it('should support CSS minification (without compilation)', () => {
    var sha = '07a580939fdce98bcd39e88e79a665067b525e5d';
    return expect(
      tolk.read(getPath('csso/basic.css'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', '/*! keep this comment */.hello{margin:0;color:silver'),
        sourcemap: {
          sources: expect.it('to have length', 1),
          mappings: expect.it('to begin with', 'wBAGA,OACE,'),
        },
        inputSha: [{ file: expect.it('to contain', 'basic.css'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: '::map::minify',
      }
    );
  });

  it('should support JS minification (with compilation)', () => {
    var sha = '416786ab8e37f3f35cd9daec8b1642510509fdb8';
    return expect(
      tolk.read(getPath('coffee/basic.coffee'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', '(function(){console.log(15)})'),
        sourcemap: {
          sources: expect.it('to have length', 1),
          mappings: expect.it('to begin with', 'CAAA,WAAAA'),
        },
        inputSha: [{ file: expect.it('to contain', 'basic.coffee'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect
          .it('to contain', 'coffee')
          .and('to contain', 'map')
          .and('to contain', 'minify'),
      }
    );
  });

  it('should support JS minification (with compilation, without sourcemaps)', () =>
    expect(
      tolk.read(getPath('coffee/basic.coffee'), {
        sourceMap: false,
        minify: true,
        outputSha: true,
      }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', '(function(){console.log(15)})'),
        sourcemap: expect.it('to be undefined'),
        inputSha: expect.it('to be undefined'),
        outputSha: expect
          .it('to have length', 40)
          .and('not to equal', '416786ab8e37f3f35cd9daec8b1642510509fdb8'),
        transformId: expect
          .it('to contain', 'coffee')
          .and('not to contain', 'map')
          .and('to contain', 'minify'),
      }
    ));

  it('should support JS minification (without compilation)', () => {
    var sha = '2a885694e91858a92b6c0ef104430ad0f9082375';
    return expect(
      tolk.read(getPath('minify-js/basic.js'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', 'for(var stuff=[1,2,3,4,5],i=0;i<stuff.length;i++)'),
        sourcemap: {
          sources: expect.it('to have length', 1),
          mappings: expect.it('to begin with', 'AACA,IAAK,'),
        },
        inputSha: [{ file: expect.it('to contain', 'basic.js'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: '::map::minify',
      }
    );
  });

  it('should support HTML minification (with compilation)', () => {
    var sha = '77415ca761f1ff0bff8ce547f99722690a2e2ad1';
    return expect(
      tolk.read(getPath('jade/client-complex.jade'), { minify: true, sourceMap: false, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it(
          'to begin with',
          '<p>1</p><p>1</p><p>2</p><p>2</p><p>3</p><p>3</p><p>4</p><p>4</p><div class="1">'
        ),
        inputSha: [{ file: expect.it('to contain', 'client-complex.jade'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: expect
          .it('to contain', 'jade')
          .and('not to contain', 'map')
          .and('to contain', 'minify'),
      }
    );
  });

  it('should support HTML minification (without compilation)', () => {
    var sha = '5ef84517d625346bc90acee44a909377b7b48267';
    return expect(
      tolk.read(getPath('minify-html/basic.html'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', '<div class="foobar"><p>wowlaween</p><div>'),
        inputSha: [{ file: expect.it('to contain', 'basic.html'), sha }],
        outputSha: expect.it('to have length', 40).and('not to equal', sha),
        transformId: '::map::minify',
      }
    );
  });

  it('should not compile files beginning with underscore', () => {
    var sha = '203b01f13b963eb5ec2f60a8e9a3364681c58b86';
    return expect(
      tolk.read(getPath('scss/_mixin_lib.scss'), { minify: true, sha: true }),
      'to be fulfilled with',
      {
        result: expect.it('to begin with', '@mixin set_color($color) {\n  color: $color;'),
        inputSha: [{ file: expect.it('to contain', '_mixin_lib.scss'), sha }],
        outputSha: sha,
        transformId: '::map::minify',
      }
    );
  });

  it('should throw when compiling a file that does not exist', () =>
    expect(tolk.read(getPath('does-not-exist.scss')), 'when rejected', 'to satisfy', {
      code: 'ENOENT',
      path: /fixtures\/source\/does-not-exist\.scss$/,
      message: /^ENOENT.*?, open '.+?fixtures\/source\/does-not-exist\.scss'$/,
    }));

  it('should throw when compiling a file with syntax errors', () =>
    expect(tolk.read(getPath('scss/syntaxerror.scss')), 'when rejected', 'to satisfy', {
      status: 1,
      file: /fixtures\/source\/scss\/syntaxerror\.scss$/,
      line: 2,
      column: 3,
      message: 'property "color" must be followed by a \':\'',
    }));
});
