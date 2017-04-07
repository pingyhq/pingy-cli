'use strict';

var baconize = require('../');
var path = require('path');

var input = path.join(__dirname, '/site/');
var output = path.join(__dirname, '/output/');

baconize(input, output, {compile: true, minify: true, sourcemaps: true})
  .then(function(numFiles) {
    console.log('Baconized Successfully. Copied ' + numFiles + ' files.');
  }, function(err) {
    console.error('Baconize Failed', err);
  });
