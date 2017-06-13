let Adapter    = require('../../adapter_base');
let path       = require('path');
const W          = require('when');
let sourcemaps = require('../../sourcemaps');

var Buble = (function() {
  let compile = undefined;
  Buble = class Buble extends Adapter {
    static initClass() {
      this.prototype.name = 'buble';
      this.prototype.extensions = ['js'];
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
      options.source = options.filename;
      return compile(() => this.engine.transform(str, options));
    }
  };
  Buble.initClass();
  return Buble;
})();

module.exports = Buble;
