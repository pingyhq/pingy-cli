let Adapter = require('../../adapter_base');
const W       = require('when');
let util    = require('util');
let fs      = require('fs');
let path    = require('path');

var Mustache = (function() {
  let compile = undefined;
  Mustache = class Mustache extends Adapter {
    static initClass() {
      this.prototype.name = 'mustache';
      this.prototype.extensions = ['mustache', 'hogan'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['hogan.js'];
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve({result: res});
      };
    }

    _render(str, options) {
      return compile(() => this.engine.compile(str, options).render(options, options.partials));
    }

    _compile(str, options) {
      return compile(() => this.engine.compile(str, options));
    }

    _compileClient(str, options) {
      options.asString = true;
      return this._compile(str, options).then(o => ({result: `new Hogan.Template(${o.result.toString()});`}));
    }

    clientHelpers() {
      let { version } = require(path.join(this.engine.__accord_path, 'package'));
      let runtime_path = path.join(
        this.engine.__accord_path,
        `web/builds/${version}/hogan-${version}.min.js`
      );
      return fs.readFileSync(runtime_path, 'utf8');
    }
  };
  Mustache.initClass();
  return Mustache;
})();

module.exports = Mustache;
