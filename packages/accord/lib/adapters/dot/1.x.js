let Adapter  = require('../../adapter_base');
let path     = require('path');
let fs       = require('fs');
const W        = require('when');

var Dot = (function() {
  let compile = undefined;
  Dot = class Dot extends Adapter {
    static initClass() {
      this.prototype.name = 'dot';
      this.prototype.extensions = ['dot'];
      this.prototype.output = 'html';
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str, options) {
      return compile(() => this.engine.compile(str)(options));
    }

    _compile(str, options) {
      return compile(() => this.engine.compile(str, options));
    }

    _compileClient(str, options) {
      options.client = true;
      return compile(() => {
        return this.engine.compile(str, options).toString();
      });
    }

    clientHelpers(str, options) {
      let runtime_path = path.join(this.engine.__accord_path, 'doT.min.js');
      return fs.readFileSync(runtime_path, 'utf8');
    }
  };
  Dot.initClass();
  return Dot;
})();

module.exports = Dot;
