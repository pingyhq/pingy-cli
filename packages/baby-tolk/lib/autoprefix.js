'use strict';

var events = require('events');
var when = require('when');

module.exports = (function () {

  var self = new events.EventEmitter();

  self.config = function (options) {
    options = options || {};
    options.browsers = options.browsers || ['last 2 versions'];
    var autoprefixer;
    var compiler;

    try {
      autoprefixer = require('autoprefixer-core');
    } catch (e) {
      try {
        autoprefixer = require('autoprefixer');
      } catch (e) {
        var err = new Error('Autoprefixer could not be loaded. Install it to get CSS autoprefixed');

        self.emit('warn', err);
      }
    }

    if (autoprefixer) {
      compiler = autoprefixer({ browsers: options.browsers });
    }

    return when.lift(function (str) {
      if (!compiler) {
        return when.resolve(str);
      } else {
        return when.resolve(compiler.process(str).css);
      }
    });
  };

  return self;
})();
