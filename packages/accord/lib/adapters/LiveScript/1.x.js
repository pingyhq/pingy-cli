let Adapter = require('../../adapter_base');
const W       = require('when');

var LiveScript = (function() {
  let compile = undefined;
  LiveScript = class LiveScript extends Adapter {
    static initClass() {
      this.prototype.name = 'LiveScript';
      this.prototype.extensions = ['ls'];
      this.prototype.output = 'js';
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
      return compile(() => this.engine.compile(str, options));
    }
  };
  LiveScript.initClass();
  return LiveScript;
})();

module.exports = LiveScript;
