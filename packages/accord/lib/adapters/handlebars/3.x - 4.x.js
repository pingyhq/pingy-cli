let Adapter = require('../../adapter_base');
let clone   = require('lodash.clone');
let merge   = require('lodash.merge');
let path    = require('path');
let fs      = require('fs');
const W       = require('when');

var Handlebars = (function() {
  let register_helpers = undefined;
  let compile = undefined;
  Handlebars = class Handlebars extends Adapter {
    static initClass() {
      this.prototype.name = 'handlebars';
      this.prototype.extensions = ['hbs', 'handlebars'];
      this.prototype.output = 'html';
  
      /**
       * @private
      */
      register_helpers = function(compiler, opts) {
        if (opts.helpers) {
          compiler.helpers = merge(compiler.helpers, opts.helpers);
        }
        if (opts.partials) {
          return compiler.partials = merge(compiler.partials, opts.partials);
        }
      };
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str, options) {
      let compiler = clone(this.engine);
      register_helpers(compiler, options);
      return compile(() => compiler.compile(str)(options));
    }

    _compile(str, options) {
      let compiler = clone(this.engine);
      register_helpers(compiler, options);
      return compile(() => compiler.compile(str));
    }

    _compileClient(str, options) {
      let compiler = clone(this.engine);
      register_helpers(compiler, options);
      return compile(() => `Handlebars.template(${compiler.precompile(str)});`);
    }

    clientHelpers() {
      let runtime_path = path.join(
        this.engine.__accord_path,
        'dist/handlebars.runtime.min.js'
      );
      return fs.readFileSync(runtime_path, 'utf8');
    }
  };
  Handlebars.initClass();
  return Handlebars;
})();

module.exports = Handlebars;
