let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
let nodefn     = require('when/node/function');
let flatten    = require('lodash.flatten');

class Stylus extends Adapter {
  static initClass() {
    this.prototype.name = 'stylus';
    this.prototype.extensions = ['styl'];
    this.prototype.output = 'css';
  }

  _render(str, options) {
    let obj, v;
    let sets = {};
    let defines = {};
    let rawDefines = {};
    let includes = [];
    let imports = [];
    let plugins = [];

    if (options.sourcemap === true) {
      options.sourcemap = { comment: false };
    }

    for (var k in options) {
      v = options[k];
      switch (k) {
        case 'define': Object.assign(defines, v); break;
        case 'rawDefine': Object.assign(rawDefines, v); break;
        case 'include': includes.push(v); break;
        case 'import': imports.push(v); break;
        case 'use': plugins.push(v); break;
        case 'url':
          if (typeof v  === 'string') {
            obj = {};
            obj[v] = this.engine.url();
            Object.assign(defines, obj);
          } else {
            obj = {};
            obj[v.name] = this.engine.url({
              limit: (v.limit != null) ? v.limit : 30000,
              paths: v.paths || []});
            Object.assign(defines, obj);
          }
          break;
        default: sets[k] = v;
      }
    }

    includes = flatten(includes);
    imports = flatten(imports);
    plugins = flatten(plugins);

    let base = this.engine(str);

    for (k in sets) { v = sets[k]; base.set(k, v); }
    for (k in defines) { v = defines[k]; base.define(k, v); }
    for (k in rawDefines) { v = rawDefines[k]; base.define(k, v, true); }
    for (var i of Array.from(includes)) { base.include(i); }
    for (i of Array.from(imports)) { base.import(i); }
    for (i of Array.from(plugins)) { base.use(i); }

    return nodefn.call(base.render.bind(base))
      .then(res => obj = { result: res })
      .then(function(obj) {
        if (base.sourcemap) {
          return sourcemaps.inline_sources(base.sourcemap).then(function(map) {
            obj.sourcemap = map;
            return obj;
          });
        } else {
          return obj;
        }
    });
  }
}
Stylus.initClass();

module.exports = Stylus;
