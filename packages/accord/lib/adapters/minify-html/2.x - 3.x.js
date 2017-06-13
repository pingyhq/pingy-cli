let Adapter  = require('../../adapter_base');
const W        = require('when');
let defaults = require('lodash.defaults');

var MinifyHTML = (function() {
  let compile = undefined;
  MinifyHTML = class MinifyHTML extends Adapter {
    static initClass() {
      this.prototype.name = 'minify-html';
      this.prototype.extensions = ['html'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['html-minifier'];
  
      /**
       * I think that you could cause this to not be isolated by using the minifyCSS
         option and then making that import stylesheets, but I'm not even sure if
         MinifyHTML would support that...
      */
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
      options = defaults(options, {
        removeComments: true,
        collapseWhitespace: true,
        removeEmptyAttributes: true
      }
      );

      return compile(() => this.engine.minify(str, options));
    }
  };
  MinifyHTML.initClass();
  return MinifyHTML;
})();

module.exports = MinifyHTML;
