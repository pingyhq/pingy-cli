module.exports = (name, distDir) => {
  return JSON.stringify({
    name: name || 'Untitled Pingy Project',
    exportDir: distDir || 'dist',
    minify: true,
    compile: true,
    "exclusions": [{
      path: 'node_modules',
      action: 'exclude',
      type: 'dir'
    }]
  }, null, '\t');
};
