let Adapter = require('../../adapter_base');
let nodefn  = require('when/node/function');

class Markdown extends Adapter {
  static initClass() {
    this.prototype.name = 'markdown';
    this.prototype.extensions = ['md', 'mdown', 'markdown'];
    this.prototype.output = 'html';
    this.prototype.supportedEngines = ['marked'];
    this.prototype.isolated = true;
  }

  _render(str, options) {
    return nodefn.call(this.engine.bind(this.engine), str, options)
      .then(res => ({result: res}));
  }
}
Markdown.initClass();

module.exports = Markdown;
