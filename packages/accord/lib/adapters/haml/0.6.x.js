let Adapter  = require('../../adapter_base');
let path     = require('path');
let fs       = require('fs');
const W        = require('when');
let UglifyJS = require('uglify-js');

// TODO: add doctype and filter opts
// https://github.com/visionmedia/haml.js#extending-haml

var HAML = (function() {
  let compile = undefined;
  HAML = class HAML extends Adapter {
    static initClass() {
      this.prototype.name = 'haml';
      this.prototype.extensions = ['haml'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['hamljs'];
  
      // clientHelpers: ->
      //   runtime_path = path.join(@engine.__accord_path, 'haml.js')
      //   runtime = fs.readFileSync(runtime_path, 'utf8')
      //   return UglifyJS.minify(runtime, { fromString: true }).code
  
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
  };
  HAML.initClass();
  return HAML;
})();

module.exports = HAML;
