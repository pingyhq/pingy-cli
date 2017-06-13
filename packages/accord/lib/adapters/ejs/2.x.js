let Adapter = require('../../adapter_base');
let path    = require('path');
let fs      = require('fs');
const W       = require('when');

var EJS = (function() {
  let compile = undefined;
  EJS = class EJS extends Adapter {
    static initClass() {
      this.prototype.name = 'ejs';
      this.prototype.extensions = ['ejs'];
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
      options.client = true;
      return compile(() => this.engine.compile(str, options).toString());
    }

    clientHelpers(str, options) {
      let runtime_path = path.join(this.engine.__accord_path, 'ejs.min.js');
      return fs.readFileSync(runtime_path, 'utf8');
    }
  };
  EJS.initClass();
  return EJS;
})();

module.exports = EJS;
