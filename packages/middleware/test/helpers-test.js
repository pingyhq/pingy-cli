'use strict';

var Path = require('path');
var expect = require('unexpected').clone();
var helpers = require('../lib/helpers');
var babyTolk = require('@pingy/compile');

function getPath(path) {
  return Path.join(process.cwd(), 'examples/site', path);
}

describe('helpers', function() {

  describe('findSourceFile', function () {
    it('should find a source file if there is one (JS)', function () {
      return expect(helpers.findSourceFile(getPath('scripts/main.js'), babyTolk),
        'to be fulfilled with',
        getPath('scripts/main.coffee')
      );
    });

    it('should find a source file if there is one (CSS)', function () {
      return expect(helpers.findSourceFile(getPath('styles/main.css'), babyTolk),
        'to be fulfilled with',
        getPath('styles/main.styl')
      );
    });

    it('should reject with `null` when it can\'t find source file', function () {
      return expect(helpers.findSourceFile(getPath('scripts/404.js'), babyTolk),
        'to be rejected with',
        null
      );
    });

    it('should reject with `null` when path doesn\'t exist', function () {
      return expect(helpers.findSourceFile(getPath('foo/bar'), babyTolk),
        'to be rejected with',
        null
      );
    });
  });

});
