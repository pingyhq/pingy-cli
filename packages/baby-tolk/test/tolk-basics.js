'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var tolk = require('../lib/tolk');

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
    return expect(tolk.read(getPath('babel/simplest.jsx')), 'to be fulfilled with', {
      result: expect.it('to begin with', '\'use strict\';\n\nvar foo = \'bar\';')
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

  it('should throw when compiling a file that does not exist', function () {
    return expect(tolk.read(getPath('does-not-exist.scss')), 'when rejected', 'to satisfy', {
      code: 'ENOENT',
      path: /fixtures\/source\/does-not-exist\.scss$/,
      message: /^ENOENT.*?, open '.+?fixtures\/source\/does-not-exist\.scss'$/
    });
  });

  it('should throw when compiling a file with syntax errors', function () {
    return expect(tolk.read(getPath('scss/syntaxerror.scss')), 'when rejected', 'to exhaustively satisfy', {
      status: 1,
      file: /fixtures\/source\/scss\/syntaxerror\.scss$/,
      line: 2,
      column: 8,
      message: 'property "color" must be followed by a \':\'',
    });
  });

});
