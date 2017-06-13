let Adapter = require('../../adapter_base');
const W       = require('when');

var CSSO = (function() {
  let compile = undefined;
  CSSO = class CSSO extends Adapter {
    static initClass() {
      this.prototype.name = 'csso';
      this.prototype.extensions = ['css'];
      this.prototype.output = 'css';
      this.prototype.isolated = true;
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str, options) {
      if (options.restructuring == null) { options.restructuring = true; }
      if (options.debug == null) { options.debug = false; }

      return compile(() => this.engine.minify(str, options));
    }
  };
  CSSO.initClass();
  return CSSO;
})();

module.exports = CSSO;
