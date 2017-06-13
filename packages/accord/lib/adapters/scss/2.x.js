let Adapter    = require('../../adapter_base');
const W          = require('when');
let path       = require('path');

class SCSS extends Adapter {
  static initClass() {
    this.prototype.name = 'scss';
    this.prototype.extensions = ['scss', 'sass'];
    this.prototype.output = 'css';
    this.prototype.supportedEngines = ['node-sass'];
  }

  _render(str, options) {
    let deferred = W.defer();

    if (options.sourcemap) {
      if (typeof options.sourcemap === 'string') {
        options.sourceMap = options.sourcemap;
      } else {
        options.sourceMap = true;
      }
      options.outFile = path.basename(options.filename).replace('.scss', '.css');
      options.omitSourceMapUrl = true;
      options.sourceMapContents = true;
    }

    options.file = options.filename;
    options.data = str;
    options.error = err => deferred.reject(err);
    options.success = function(res) {
      let data = {
        result: String(res.css),
        imports: res.stats.includedFiles,
        meta: {
          entry: res.stats.entry,
          start: res.stats.start,
          end: res.stats.end,
          duration: res.stats.duration
        }
      };

      if (res.map && Object.keys(JSON.parse(res.map)).length) {
        data.sourcemap = JSON.parse(res.map);
        data.sourcemap.sources.pop();
        data.sourcemap.sources.push(options.file);
      }

      return deferred.resolve(data);
    };

    this.engine.render(options);

    return deferred.promise;
  }
}
SCSS.initClass();

module.exports = SCSS;