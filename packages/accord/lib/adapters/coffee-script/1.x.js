let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
let path       = require('path');
const W          = require('when');

var CoffeeScript = (function() {
  let compile = undefined;
  CoffeeScript = class CoffeeScript extends Adapter {
    static initClass() {
      this.prototype.name = 'coffee-script';
      this.prototype.extensions = ['coffee'];
      this.prototype.output = 'js';
      this.prototype.isolated = true;
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        if (res.sourceMap) {
          let data = {
            result: res.js,
            v2sourcemap: res.sourceMap,
            sourcemap: JSON.parse(res.v3SourceMap)
          };
          return sourcemaps.inline_sources(data.sourcemap).then(function(map) {
            data.sourcemap = map;
            return data;
          });
        } else {
          return W.resolve({result: res});
        }
      };
    }

    _render(str, options) {
      let { filename } = options;
      if (options.sourcemap === true) { options.sourceMap = true; }
      options.sourceFiles = [filename];
      if (options.filename) {
        options.generatedFile = path.basename(filename).replace('.coffee', '.js');
      }
      return compile(() => this.engine.compile(str, options));
    }
  };
  CoffeeScript.initClass();
  return CoffeeScript;
})();

module.exports = CoffeeScript;
