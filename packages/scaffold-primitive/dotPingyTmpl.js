'use strict';

module.exports = overwrite => ({
  name: 'Untitled Pingy Project',
  exportDir: 'dist',
  minify: true,
  compile: true,
  exclusions: [
    {
      path: 'node_modules',
      action: 'exclude',
      type: 'dir',
    }
  ],
  ...overwrite,
});
