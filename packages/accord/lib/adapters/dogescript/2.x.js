let Adapter = require('../../adapter_base');
const W       = require('when');

class DogeScript extends Adapter {
  static initClass() {
    this.prototype.name = 'dogescript';
    this.prototype.extensions = ['djs'];
    this.prototype.output = 'js';
    this.prototype.isolated = true;
  }

  _render(str, options) {
    return W.resolve({result: this.engine(str, options.beauty, options.trueDoge)});
  }
}
DogeScript.initClass();

module.exports = DogeScript;
