var chai = require('chai');
var W = require('when');
var path = require('path');
var fs = require('fs');
var accord = require('../..');

global.should = chai.should();
global.accord = accord;
global.W = W;

global.should.match_expected = function (compiler, content, epath) {
  // console.log(content);
  var parser;
  switch (compiler.output) {
    case 'html':
      parser = require('parse5').parse;
      break;
    case 'css':
      parser = require('css-parse');
      break;
    case 'js':
      parser = require('acorn').parse;
      break;
    default:
      parser = function (str) {
        return str;
      };
  }

  var expected_path = path.join(
    path.dirname(epath),
    'expected',
    path.basename(epath, compiler.extensions[0]) + compiler.output
  );

  fs.existsSync(expected_path).should.be.ok;

  var expected = parser(fs.readFileSync(expected_path, 'utf8').trim());
  var results = parser(content.trim());

  expected.should.deep.eql(results);
};
