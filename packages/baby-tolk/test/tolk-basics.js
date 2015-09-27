'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
expect.installPlugin(require('unexpected-promise'));

expect.addAssertion('string', 'to begin with', function (expect, subject, cmp) {
  expect(cmp, 'to be a string');

  expect(subject.substr(0, cmp.length), 'to be', cmp);
});


var tolk = require('../lib/tolk');

function getPath(path) {
  return Path.join(process.cwd(), 'fixtures/source', path);
}

describe('readCompiled', function () {
  it('should read a file directly if there is no adapter', function () {
    return expect(tolk.read(getPath('unchanged.txt')), 'to be resolved with', {
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
    return expect(tolk.read(getPath('babel/simplest.jsx')), 'to be resolved with', {
      result: expect.it('to begin with', '\'use strict\';\n\nvar foo = \'bar\';\n//# sourceMappingURL=data:application/json;base64,')
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
      column: 3,
      message: 'property "color" must be followed by a \':\'',
      code: 1
    });
  });

  it('should autoprefix uncompiled CSS output', function () {
    return expect(tolk.read(getPath('basic.css')), 'to be resolved with', {
      result: 'body {\n  -webkit-transform: rotate(-1deg);\n          transform: rotate(-1deg);\n}\n'
    });
  });

  it('should autoprefix compiled CSS output', function () {
    return expect(tolk.read(getPath('scss/autoprefix.scss')), 'to be resolved with', {
      result: expect.it('to begin with', 'body {\n  -webkit-transform: rotate(-1deg);\n          transform: rotate(-1deg); }\n\n/*# sourceMappingURL=data:application/json;base64,')
    });
  });
});
