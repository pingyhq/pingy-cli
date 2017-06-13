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
      options.outFile = options.filename.replace('.scss', '.css');
      options.omitSourceMapUrl = true;
      options.sourceMapContents = true;
    }

    options.file = options.filename;
    options.data = str;

    this.engine.render(options, function(err, res) {
      if (err) { return deferred.reject(err); }

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

      if (res.map) {
        data.sourcemap = JSON.parse(res.map.toString('utf8'));
        let basePath = path.dirname(options.filename);
        if (typeof options.sourceMap !== 'string') {
          data.sourcemap.sources =
            data.sourcemap.sources.map(relativePath => path.join(basePath, relativePath));
        }
      }

      return deferred.resolve(data);
    });

    return deferred.promise;
  }
}
SCSS.initClass();

module.exports = SCSS;
