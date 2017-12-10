let Adapter = require('../../adapter_base');
const W     = require('when');
const ts = require('typescript');

var TypeScript = (function() {
  let compile = undefined;
  TypeScript = class TypeScript extends Adapter {
    static initClass() {
      this.prototype.name = 'typescript';
      this.prototype.engineName = 'typescript-compiler';
      this.prototype.supportedEngines = ['typescript-compiler'];
      this.prototype.extensions = ['ts'];
      this.prototype.output = 'js';
      this.prototype.isolated = true;
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res.outputText});
      };
    }

    _render(str, options) {
      let throwOnError = function(err) { 
        throw err;
      };

      return compile(() => ts.transpileModule(str, { compilerOptions: options.tsc }));
    }
  };
  TypeScript.initClass();
  return TypeScript;
})();

module.exports = TypeScript;
