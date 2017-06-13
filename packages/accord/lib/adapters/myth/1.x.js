let Adapter    = require('../../adapter_base');
let convert    = require('convert-source-map');
const W          = require('when');

var Myth = (function() {
  let compile = undefined;
  Myth = class Myth extends Adapter {
    static initClass() {
      this.prototype.name = 'myth';
      this.prototype.extensions = ['myth', 'mcss'];
      this.prototype.output = 'css';
  
      // private
  
      compile = function(sourcemap, fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
  
        let data = { result: res };
  
        if (sourcemap) {
          let map = convert.fromSource(res).sourcemap;
          let src = convert.removeComments(res);
          data = { result: src, sourcemap: map };
        }
  
        return W.resolve(data);
      };
    }

    _render(str, options) {
      options.source = options.filename;
      delete options.filename;
      return compile(options.sourcemap, (() => this.engine(str, options)));
    }
  };
  Myth.initClass();
  return Myth;
})();

module.exports = Myth;
