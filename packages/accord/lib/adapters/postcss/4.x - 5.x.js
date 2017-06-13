let Adapter    = require('../../adapter_base');
let sourcemaps = require('../../sourcemaps');
const W          = require('when');
let path       = require('path');
let convert    = require('convert-source-map');

class PostCSS extends Adapter {
  static initClass() {
    this.prototype.name = 'postcss';
    this.prototype.extensions = ['css', 'pcss', 'sss'];
    this.prototype.output = 'css';
  }

  _render(str, options) {
    let use = options.use != null ? options.use : [];
    let processor = this.engine(use);

    if (options.map === true) {
      options.map = {inline: false};
      options.from = options.filename;
    }

    return W(processor.process(str, options))
      .then(function(res) {
        let obj = { result: res.css };

        if (options.map) {
          obj.sourcemap = JSON.parse(res.map);
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
}
PostCSS.initClass();

module.exports = PostCSS;
