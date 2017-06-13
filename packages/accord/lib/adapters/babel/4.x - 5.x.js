let Adapter    = require('../../adapter_base');
let path       = require('path');
const W          = require('when');
let sourcemaps = require('../../sourcemaps');

var Babel = (function() {
  let compile = undefined;
  Babel = class Babel extends Adapter {
    static initClass() {
      this.prototype.name = 'babel';
      this.prototype.extensions = ['jsx', 'js'];
      this.prototype.output = 'js';
      this.prototype.isolated = true;
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
  
        let data = { result: res.code };
        if (res.map) {
          return sourcemaps.inline_sources(res.map).then(function(map) {
            data.sourcemap = map;
            return data;
          });
        } else {
          return W.resolve(data);
        }
      };
    }

    _render(str, options) {
      let { filename } = options;

      if (options.sourcemap === true) { options.sourceMap = true; }
      options.sourceMapName = filename;
      delete options.sourcemap;

      return compile(() => this.engine.transform(str, options));
    }
  };
  Babel.initClass();
  return Babel;
})();

module.exports = Babel;
