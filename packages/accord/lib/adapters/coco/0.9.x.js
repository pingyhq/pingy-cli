let Adapter = require('../../adapter_base');
const W       = require('when');

var Coco = (function() {
  let compile = undefined;
  Coco = class Coco extends Adapter {
    static initClass() {
      this.prototype.name = 'coco';
      this.prototype.extensions = ['co'];
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
  Coco.initClass();
  return Coco;
})();

module.exports = Coco;
