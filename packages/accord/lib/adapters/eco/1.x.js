let Adapter = require('../../adapter_base');
let path    = require('path');
let fs      = require('fs');
const W       = require('when');

var Eco = (function() {
  let compile = undefined;
  Eco = class Eco extends Adapter {
    static initClass() {
      this.prototype.name = 'eco';
      this.prototype.extensions = ['eco'];
      this.prototype.output = 'html';
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str,options) {
      return compile(() => this.engine.render(str,options));
    }

    _compile(str,options) {
      return compile(() => this.engine.compile(str,options))
        .then(function(res) { res.result = eval(res.result); return res; });
    }

    _compileClient(str,options) {
      return compile(() => this.engine.compile(str,options).toString().trim() + '\n');
    }
  };
  Eco.initClass();
  return Eco;
})();

module.exports = Eco;
