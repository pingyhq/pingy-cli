let Adapter = require('../../adapter_base');
const W = require('when');
let fs = require('fs');

var Toffee = (function() {
  let compile = undefined;
  Toffee = class Toffee extends Adapter {
    static initClass() {
      this.prototype.name = 'toffee';
      this.prototype.extensions = ['toffee'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['toffee'];
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str, options) {
      return compile(() => this.engine.str_render(str, options, function(err, res) {
        if (res.indexOf("<div style=\"font-family:courier new;font-size:12px;color:#900;width:100%;\">") !== -1) {
          throw res;
        } else { return res; }
        })
      );
    }

    _compile(str, options) {
      return compile(() => this.engine.compileStr(str).toString());
    }

    _compileClient(str, options) {
      return compile(() => this.engine.configurable_compile(str, options));
    }
  };
  Toffee.initClass();
  return Toffee;
})();

module.exports = Toffee;
