let Adapter = require('../../adapter_base');
let path = require('path');
let fs = require('fs');
const W = require('when');
let UglifyJS = require('uglify-js');

var Pug = (function () {
  let compile;
  Pug = class Pug extends Adapter {
    static initClass() {
      this.prototype.name = 'pug';
      this.prototype.extensions = ['pug'];
      this.prototype.output = 'html';
      this.prototype.supportedEngines = ['pug'];

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
  };
  Pug.initClass();
  return Pug;
}());

module.exports = Pug;
