let Adapter = require('../../adapter_base');
const W       = require('when');
let defaults = require('lodash.defaults');

var EscapeHTML = (function() {
  let compile = undefined;
  EscapeHTML = class EscapeHTML extends Adapter {
    static initClass() {
      this.prototype.name = 'escape-html';
      this.prototype.extensions = ['html'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['he'];
  
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
      options = defaults(options,
        {allowUnsafeSymbols: true});

      return compile(() => this.engine.encode(str, options));
    }
  };
  EscapeHTML.initClass();
  return EscapeHTML;
})();

module.exports = EscapeHTML;
