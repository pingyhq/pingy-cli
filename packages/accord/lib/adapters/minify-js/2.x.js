let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
const W          = require('when');
let path       = require('path');
let convert    = require('convert-source-map');

var MinifyJS = (function() {
  let compile = undefined;
  MinifyJS = class MinifyJS extends Adapter {
    static initClass() {
      this.prototype.name = 'minify-js';
      this.prototype.extensions = ['js'];
      this.prototype.output = 'js';
      this.prototype.supportedEngines = ['uglify-js'];
      this.prototype.isolated = true;
  
      // private
  
      compile = function(fn, map) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
        return W.resolve(res);
      };
    }

    _render(str, options) {
      if (options.sourcemap === true) {
        options.sourceMap = true;
        options.outSourceMap = path.basename(options.filename);
      }

      return compile(() => {
        let res = this.engine.minify(str, Object.assign(options, {fromString: true}));
        let obj = { result: res.code };

        if (options.sourceMap) {
          obj.sourcemap = JSON.parse(res.map);
          // TODO: This is currently an inadequate hack to fix either a bug in
          // uglify or a piece of docs I couldn't find. Open issue here:
          // https://github.com/mishoo/UglifyJS2/issues/579
          obj.sourcemap.sources.pop();
          obj.sourcemap.sources.push(options.filename);
          obj.result = convert.removeMapFileComments(obj.result).trim();
          return sourcemaps.inline_sources(obj.sourcemap).then(function(map) {
            obj.sourcemap = map;
            return obj;
          });
        } else {
          return obj;
        }
      });
    }
  };
  MinifyJS.initClass();
  return MinifyJS;
})();

module.exports = MinifyJS;
