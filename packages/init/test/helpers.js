'use strict';

var fs = require('fs');
var fsPath = require('path');
var Q = require('q');

var walk = function (dir) {
  return Q.ninvoke(fs, 'readdir', dir).then(function (files) {
    return Q.all(files.map(function (file) {
      file = fsPath.join(dir, file);
      return Q.ninvoke(fs, 'lstat', file).then(function (stat) {
        if (stat.isDirectory()) {
          return walk(file);
        } else {
          return [file];
        }
      });
    }));
  }).then(function (files) {
    return files.reduce(function (pre, cur) {
      return pre.concat(cur);
    });
  });
};

module.exports = {};
module.exports.walk = walk;
