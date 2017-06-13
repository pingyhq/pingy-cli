let abstract_mapper, adapter_to_name, name_to_adapter, supports;
let path    = require('path');
let fs      = require('fs');
let glob    = require('glob');
let indx    = require('indx');
let resolve = require('resolve');
let semver  = require('semver');

exports.supports = (supports = function(name) {
  name = adapter_to_name(name);
  return !!glob.sync(`${path.join(__dirname, 'adapters', name)}`).length;
});

exports.load = function(name, custom_path, engine_name) {
  name = adapter_to_name(name);
  let engine_path = resolve_engine_path(name, custom_path);
  let version = get_version(engine_path);
  let adapter_name = match_version_to_adapter(name, version);

  if (!adapter_name) {
    throw new Error(`${name} version ${version} is not currently supported`);
  }

  return new (require(adapter_name))(engine_name, engine_path);
};

exports.all = () => indx(path.join(__dirname, 'adapters'));

// Responsible for mapping between adapters where the language name
// does not match the node module name. direction can be "left" or "right",
// "left" being lang name -> adapter name and right being the opposite.
exports.abstract_mapper = (abstract_mapper = function(name, direction) {
  let name_maps = [
    ['markdown', 'marked'],
    ['minify-js', 'uglify-js'],
    ['minify-css', 'clean-css'],
    ['minify-html', 'html-minifier'],
    ['mustache', 'hogan.js'],
    ['scss', 'node-sass'],
    ['haml', 'hamljs'],
    ['escape-html', 'he'],
    ['jsx', 'react-tools'],
    ['cjsx', 'coffee-react-transform'],
    ['babel', 'babel-core'],
    ['typescript', 'typescript-compiler']
  ];

  let res = null;
  name_maps.forEach(function(n) {
    if ((direction === 'left') && (n[0] === name)) { res = n[1]; }
    if ((direction === 'right') && (n[1] === name)) { return res = n[0]; }});

  return res || name;
});

exports.adapter_to_name = (adapter_to_name = name => abstract_mapper(name, 'right'));

exports.name_to_adapter = (name_to_adapter = name => abstract_mapper(name, 'left'));

var resolve_engine_path = function(name, custom_path) {
  let filepath = (custom_path != null) ?
    resolve.sync(name_to_adapter(name), {basedir: custom_path})
  :
    require.resolve(name_to_adapter(name));

  while (true) {
    if (filepath === '/') {
      throw new Error(`cannot resolve root of node module ${name}`);
    }
    filepath = path.dirname(filepath); // cut off the last part of the path
    if (fs.existsSync(path.join(filepath, 'package.json'))) {
      // if there's a package.json directly under it, we've found the root of
      // the module
      return filepath;
    }
  }
};

var get_version = function(engine_path) {
  try {
    return require(engine_path + '/package.json').version;
  } catch (err) {}
};

var match_version_to_adapter = function(name, version) {
  let adapters = fs.readdirSync(path.join(__dirname, 'adapters', name));
  for (let adapter of Array.from(adapters)) {
    adapter = adapter.replace(/\.(?:js|coffee)$/, '');
    if (semver.satisfies(version, adapter)) {
      return path.join(__dirname, 'adapters', name, adapter);
    }
  }
};
