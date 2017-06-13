let Adapter  = require('../../adapter_base');
let path     = require('path');
let fs       = require('fs');
const W        = require('when');
let UglifyJS = require('uglify-js');

var Swig = (function() {
  let compile = undefined;
  Swig = class Swig extends Adapter {
    static initClass() {
      this.prototype.name = 'swig';
      this.prototype.extensions = ['swig'];
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
      return compile(() => this.engine.render(str, options));
    }

    _compile(str, options) {
      return compile(() => this.engine.compile(str, options));
    }

    _compileClient(str, options) {
      return compile(() => this.engine.precompile(str, options).tpl.toString());
    }

    renderFile(path, options) {
      if (options == null) { options = {}; }
      return compile(() => this.engine.renderFile(path, options.locals));
    }

    compileFile(path, options) {
      if (options == null) { options = {}; }
      return compile(() => this.engine.compileFile(path, options));
    }

    clientHelpers() {
      let runtime_path = path.join(this.engine.__accord_path, 'dist/swig.min.js');
      return fs.readFileSync(runtime_path, 'utf8');
    }
  };
  Swig.initClass();
  return Swig;
})();

module.exports = Swig;
