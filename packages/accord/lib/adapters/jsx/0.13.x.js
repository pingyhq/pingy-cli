let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
let path       = require('path');
const W          = require('when');

var JSX = (function() {
  let compile = undefined;
  JSX = class JSX extends Adapter {
    static initClass() {
      this.prototype.name = 'jsx';
      this.prototype.extensions = ['jsx'];
      this.prototype.output = 'js';
      this.prototype.supportedEngines = ['react-tools'];
      this.prototype.isolated = true;
  
      // private
  
      compile = function(opts, fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        if (res.sourceMap) {
          let data = {
            result: res.code,
            sourcemap: res.sourceMap
          };
  
          // this is an error in the react-tools module
          // https://github.com/facebook/react/issues/3140
          data.sourcemap.sources.pop();
          data.sourcemap.sources.push(opts.filename);
  
          return sourcemaps.inline_sources(data.sourcemap).then(function(map) {
            data.sourcemap = map;
            return data;
          });
        } else {
          return W.resolve({result: res.code});
        }
      };
    }

    _render(str, options) {
      if (options.sourcemap === true) {
        options.sourceMap = true;
        options.sourceFilename = options.filename;
      }

      return compile(options, () => this.engine.transformWithDetails(str, options));
    }
  };
  JSX.initClass();
  return JSX;
})();

module.exports = JSX;
