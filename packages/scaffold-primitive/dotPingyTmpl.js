'use strict';

module.exports = overwrite =>
  Object.assign(
    {
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
    },
    overwrite
  );
