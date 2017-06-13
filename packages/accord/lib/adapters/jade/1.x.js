let Adapter = require('../../adapter_base');
let path = require('path');
let fs = require('fs');
const W = require('when');
let UglifyJS = require('uglify-js');

var Jade = (function () {
  let compile;
  Jade = class Jade extends Adapter {
    static initClass() {
      this.prototype.name = 'jade';
      this.prototype.extensions = ['jade'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['jade'];

      // private

      compile = function (fn) {
        let res;
        try {
          res = fn();
        } catch (err) {
          return W.reject(err);
        }
        return W.resolve({
          result: res.result || res,
          dependencies: res.dependencies,
        });
      };
    }

    _render(str, options) {
      return compile(() => {
        let res = this.engine.compile(str, options);
        const compiled = typeof res === 'function' ? res(options) : res;
        return {
          result: compiled,
          dependencies: res.dependencies,
        };
      });
    }

    _compile(str, options) {
      return compile(() => this.engine.compile(str, options));
    }

    _compileClient(str, options) {
      return compile(() => this.engine.compileClient(str, options));
    }

    clientHelpers() {
      let runtime_path = path.join(this.engine.__accord_path, 'runtime.js');
      let runtime = fs.readFileSync(runtime_path, 'utf8');
      return UglifyJS.minify(runtime, { fromString: true }).code;
    }
  };
  Jade.initClass();
  return Jade;
}());

module.exports = Jade;
