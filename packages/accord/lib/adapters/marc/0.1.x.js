let Adapter = require('../../adapter_base');
const W       = require('when');

class Marc extends Adapter {
  static initClass() {
    this.prototype.name = 'marc';
    this.prototype.extensions = ['md'];
    this.prototype.output = 'html';
  }

  _render(str, options) {
    // marc mutates the compiler, so we need to keep the original fresh
    let v;
    let base = this.engine();

    // use marc's functions to configure the compiler
    for (var k in options['data']) { v = options['data'][k]; base.set(k, v); }
    delete options['data'];
    for (k in options['partial']) { v = options['partial'][k]; base.partial(k, v); }
    delete options['partial'];
    for (k in options['filter']) { v = options['filter'][k]; base.filter(k, v); }
    delete options['filter'];

    // all the remaining options are options for marked
    base.config(options);
    return W.resolve({result: base(str, true)});
  }
}
Marc.initClass();

module.exports = Marc;
