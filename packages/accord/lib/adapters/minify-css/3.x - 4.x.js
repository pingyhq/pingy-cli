let Adapter = require('../../adapter_base');
const W       = require('when');

var MinifyCSS = (function() {
  let compile = undefined;
  MinifyCSS = class MinifyCSS extends Adapter {
    static initClass() {
      this.prototype.name = 'minify-css';
      this.prototype.extensions = ['css'];
      this.prototype.output = 'css';
      this.prototype.supportedEngines = ['clean-css'];
  
      /**
       * It is sometimes isolated, but not always because you can get it to process
         `import` rules with `processImport`
      */
      this.prototype.isolated = false;
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        if (res.errors.length > 0) { W.reject(res); }
        return W.resolve({result: res.styles, warnings: res.warnings, stats: res.stats});
      };
    }

    _render(str, options) {
      return compile(() => (new this.engine(options)).minify(str));
    }
  };
  MinifyCSS.initClass();
  return MinifyCSS;
})();

module.exports = MinifyCSS;
