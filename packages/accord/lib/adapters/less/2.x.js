let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
const W          = require('when');

class Less extends Adapter {
  static initClass() {
    this.prototype.name = 'less';
    this.prototype.extensions = ['less'];
    this.prototype.output = 'css';
  
    /**
     * LESS has import rules for other LESS stylesheets
    */
    this.prototype.isolated = false;
  }

  _render(str, options) {
    let deferred = W.defer();

    if (options.sourcemap === true) { options.sourceMap = true; }

    this.engine.render(str, options, function(err, res) {
      if (err) { return deferred.reject(err); }
      let obj = {
        result: res.css,
        imports: res.imports
      };
      if (options.sourceMap && res.map) {
        obj.sourcemap = JSON.parse(res.map);
        return sourcemaps.inline_sources(obj.sourcemap).then(function(map) {
          obj.sourcemap = map;
          return deferred.resolve(obj);
        });
      } else {
        return deferred.resolve(obj);
      }
    });

    return deferred.promise;
  }
}
Less.initClass();

module.exports = Less;
