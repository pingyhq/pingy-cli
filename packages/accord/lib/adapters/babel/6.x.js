let path       = require('path');
const W          = require('when');
let pick       = require('lodash.pick');
let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');

var Babel = (function() {
  let compile = undefined;
  Babel = class Babel extends Adapter {
    static initClass() {
      this.prototype.name = 'babel';
      this.prototype.extensions = ['js', 'jsx'];
      this.prototype.output = 'js';
      this.prototype.isolated = true;
      this.prototype.supportedEngines = ['babel-core'];
  
      // private
  
      compile = function(fn) {
        let res;
        try { res = fn(); }
        catch (err) { return W.reject(err); }
  
        let data = { result: res.code };
        if (res.map) {
          // Convert source to absolute path.
          // This is done for consistency with other accord adapters.
          if (res.map.sources) {
            let dirname = path.dirname(res.options.filename);
            res.map.sources =
                res.map.sources.map(source => path.join(dirname, source));
          }
  
          return sourcemaps.inline_sources(res.map).then(function(map) {
            data.sourcemap = map;
            return data;
          });
        } else {
          return W.resolve(data);
        }
      };
    }

    _render(str, options) {
      let { filename } = options;

      if (options.sourcemap === true) { options.sourceMaps = true; }
      options.sourceFileName = filename;
      delete options.sourcemap;

      // Babel will crash if you pass any keys others than ones they accept in the
      // options object. To be fair, accord should not populate the options object
      // with potentially unused options, or even options that might cause errors
      // as they do here. Eventually this should be fixed up. But to prevent
      // babel-specific breakage, we sanitize the options object here in the
      // meantime.

      let allowed_keys = ['filename', 'filenameRelative', 'presets', 'plugins',
      'highlightCode', 'only', 'ignore', 'auxiliaryCommentBefore',
      'auxiliaryCommentAfter', 'sourceMaps', 'inputSourceMap', 'sourceMapTarget',
      'sourceRoot', 'moduleRoot', 'moduleIds', 'moduleId', 'getModuleId',
      'resolveModuleSource', 'code', 'babelrc', 'ast', 'compact', 'comments',
      'shouldPrintComment', 'env', 'retainLines', 'extends'];
      let sanitized_options = pick(options, allowed_keys);

      return compile(() => this.engine.transform(str, sanitized_options));
    }
  };
  Babel.initClass();
  return Babel;
})();

module.exports = Babel;
