let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
let path       = require('path');
const W          = require('when');

var CJSX = (function() {
  let compile = undefined;
  CJSX = class CJSX extends Adapter {
    static initClass() {
      this.prototype.name = 'cjsx';
      this.prototype.extensions = ['cjsx'];
      this.prototype.output = 'coffee';
      this.prototype.supportedEngines = ['coffee-react-transform'];
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
      let { filename } = options;
      return compile(() => this.engine(str));
    }
  };
  CJSX.initClass();
  return CJSX;
})();

module.exports = CJSX;
