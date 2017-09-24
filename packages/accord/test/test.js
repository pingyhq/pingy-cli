const path = require('path');
const fs = require('fs');
const uniq = require('lodash.uniq');
const os = require('os');

const winSkip = os.platform() === 'win32' ? it.skip : it;

describe('base functions', () => {
  it('supports should work', () => {
    accord.supports('jade').should.be.ok;
    accord.supports('markdown').should.be.ok;
    accord.supports('marked').should.be.ok;
    return accord.supports('blargh').should.not.be.ok;
  });

  it('load should work', () => {
    (() => accord.load('jade')).should.not.throw();
    return (() => accord.load('blargh')).should.throw();
  });

  it('load should accept a custom path', () => {
    return (() =>
      accord.load('jade', path.join(__dirname, '../node_modules/jade'))).should.not.throw();
  });

  it("load should resolve a custom path using require's algorithm", () => {
    return (() =>
      accord.load(
        'jade',
        path.join(__dirname, '../node_modules/jade/missing/path')
      )).should.not.throw();
  });

  it('all should return all adapters', () => {
    return accord.all().should.be.a('object');
  });

  return it.skip('should throw an error when attempting to load an unsupported version', () =>
    (() => accord.load('xxx')).should.throw('xxx version x is not currently supported')
  );
});

describe('jade', () => {
  before(function () {
    this.jade = accord.load('jade');
    return (this.path = path.join(__dirname, 'fixtures', 'jade'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.jade.extensions.should.be.an.instanceOf(Array);
    this.jade.output.should.be.a('string');
    this.jade.engine.should.be.ok;
    return this.jade.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.jade
      .render('p BLAHHHHH\np= foo', { foo: 'such options' })
      .then(res =>
        should.match_expected(this.jade, res.result, path.join(this.path, 'rstring.jade'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.jade');
    return this.jade
      .renderFile(lpath, { foo: 'such options' })
      .then(res => should.match_expected(this.jade, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.jade
      .compile('p why cant I shot web?\np= foo')
      .then(res =>
        should.match_expected(
          this.jade,
          res.result({ foo: 'such options' }),
          path.join(this.path, 'pstring.jade')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.jade');
    return this.jade
      .compileFile(lpath)
      .then(res => should.match_expected(this.jade, res.result({ foo: 'such options' }), lpath));
  });

  it('should client-compile a string', function () {
    return this.jade
      .compileClient('p imma firin mah lazer!\np= foo', { foo: 'such options' })
      .then(res =>
        should.match_expected(this.jade, res.result, path.join(this.path, 'cstring.jade'))
      );
  });

  it('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.jade');
    return this.jade
      .compileFileClient(lpath, { foo: 'such options' })
      .then(res => should.match_expected(this.jade, res.result, lpath));
  });

  it('should handle external file requests', function () {
    const lpath = path.join(this.path, 'partial.jade');
    return this.jade
      .renderFile(lpath)
      .then(res => should.match_expected(this.jade, res.result, lpath));
  });

  it('should render with client side helpers', function () {
    const lpath = path.join(this.path, 'client-complex.jade');
    return this.jade.compileFileClient(lpath).then((res) => {
      const tpl_string = `${this.jade.clientHelpers()}${res.result}; template({ wow: 'local' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.jade, tpl, lpath);
    });
  });

  it('should correctly handle errors', function () {
    return this.jade
      .render('!= nonexistantfunction()')
      .catch(err => err.message.should.equal('nonexistantfunction is not a function on line 1'));
  });

  return it('should handle rapid async calls with different deeply nested locals correctly', function () {
    const lpath = path.join(this.path, 'async.jade');
    const opts = { wow: { such: 'test' } };
    return W.map(__range__(1, 100, true), (i) => {
      opts.wow = { such: i };
      return this.jade.renderFile(lpath, opts).catch(should.not.exist);
    }).then(res => uniq(res).length.should.equal(res.length));
  });
});

describe('pug', () => {
  before(function () {
    this.pug = accord.load('pug');
    return (this.path = path.join(__dirname, 'fixtures', 'pug'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.pug.extensions.should.be.an.instanceOf(Array);
    this.pug.output.should.be.a('string');
    this.pug.engine.should.be.ok;
    return this.pug.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.pug
      .render('p BLAHHHHH\np= foo', { foo: 'such options' })
      .then(res =>
        should.match_expected(this.pug, res.result, path.join(this.path, 'rstring.pug'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.pug');
    return this.pug
      .renderFile(lpath, { foo: 'such options' })
      .then(res => should.match_expected(this.pug, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.pug
      .compile('p why cant I shot web?\np= foo')
      .then(res =>
        should.match_expected(
          this.pug,
          res.result({ foo: 'such options' }),
          path.join(this.path, 'pstring.pug')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.pug');
    return this.pug
      .compileFile(lpath)
      .then(res => should.match_expected(this.pug, res.result({ foo: 'such options' }), lpath));
  });

  it('should client-compile a string', function () {
    return this.pug.compileClient('p imma firin mah lazer!\np= foo').then((res) => {
      const tpl_string = `${res.result}; template({ foo: 'such options' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.pug, tpl, path.join(this.path, 'cstring.pug'));
    });
  });

  it('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.pug');
    return this.pug.compileFileClient(lpath).then((res) => {
      const tpl_string = `${res.result}; template({ foo: 'such options' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.pug, tpl, lpath);
    });
  });

  it('should handle external file requests', function () {
    const lpath = path.join(this.path, 'partial.pug');
    return this.pug
      .renderFile(lpath)
      .then(res => should.match_expected(this.pug, res.result, lpath));
  });

  it('should render complex pug files', function () {
    const lpath = path.join(this.path, 'client-complex.pug');
    return this.pug.compileFileClient(lpath).then((res) => {
      const tpl_string = `${res.result}; template({ wow: 'local' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.pug, tpl, lpath);
    });
  });

  it('should correctly handle errors', function () {
    return this.pug
      .render('!= nonexistantfunction()')
      .catch(err => err.message.should.equal('nonexistantfunction is not a function on line 1'));
  });

  return it('should handle rapid async calls with different deeply nested locals correctly', function () {
    const lpath = path.join(this.path, 'async.pug');
    const opts = { wow: { such: 'test' } };
    return W.map(__range__(1, 100, true), (i) => {
      opts.wow = { such: i };
      return this.pug.renderFile(lpath, opts).catch(should.not.exist);
    }).then(res => uniq(res).length.should.equal(res.length));
  });
});

describe.skip('swig', () => {
  before(function () {
    this.swig = accord.load('swig');
    return (this.path = path.join(__dirname, 'fixtures', 'swig'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.swig.extensions.should.be.an.instanceOf(Array);
    this.swig.output.should.be.a('string');
    this.swig.engine.should.be.ok;
    return this.swig.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.swig
      .render('<h1>{% if foo %}Bar{% endif %}</h1>', { locals: { foo: true } })
      .then(res =>
        should.match_expected(this.swig, res.result, path.join(this.path, 'string.swig'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.swig');
    return this.swig
      .renderFile(lpath, { locals: { author: 'Jeff Escalante' } })
      .then(res => should.match_expected(this.swig, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.swig
      .compile('<h1>{{ title }}</h1>')
      .then(res =>
        should.match_expected(
          this.swig,
          res.result({ title: 'Hello!' }),
          path.join(this.path, 'pstring.swig')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.swig');
    return this.swig
      .compileFile(lpath)
      .then(res => should.match_expected(this.swig, res.result({ title: 'Hello!' }), lpath));
  });

  it.skip('should client-compile a string', function () {
    return this.swig
      .compileClient('<h1>{% if foo %}Bar{% endif %}</h1>', { foo: true })
      .then(res =>
        should.match_expected(this.swig, res.result, path.join(this.path, 'cstring.swig'))
      );
  });

  it.skip('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.swig');
    return this.swig
      .compileFileClient(lpath)
      .then(res => should.match_expected(this.swig, res.result, lpath));
  });

  it('should handle external file requests', function () {
    const lpath = path.join(this.path, 'partial.swig');
    return this.swig
      .renderFile(lpath)
      .then(res => should.match_expected(this.swig, res.result, lpath));
  });

  return it('should render with client side helpers', function () {
    const lpath = path.join(this.path, 'client-complex.swig');
    return this.swig.compileFileClient(lpath).then((res) => {
      const tpl_string = `window = {}; ${this.swig.clientHelpers()};\n var tpl = (${res.result});`;
      return should.match_expected(this.swig, tpl_string, lpath);
    });
  });
});

describe('coffeescript', () => {
  before(function () {
    this.coffee = accord.load('coffee-script');
    return (this.path = path.join(__dirname, 'fixtures', 'coffee'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.coffee.extensions.should.be.an.instanceOf(Array);
    this.coffee.output.should.be.a('string');
    this.coffee.engine.should.be.ok;
    return this.coffee.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.coffee
      .render('console.log "test"', { bare: true })
      .then(res =>
        should.match_expected(this.coffee, res.result, path.join(this.path, 'string.coffee'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.coffee');
    return this.coffee
      .renderFile(lpath)
      .then(res => should.match_expected(this.coffee, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.coffee.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.coffee
      .render('!   ---@#$$@%#$')
      .then(should.not.exist)
      .catch(x => x);
  });

  return it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.coffee');
    return this.coffee.renderFile(lpath, { sourcemap: true }).then((res) => {
      res.sourcemap.should.exist;
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      res.v2sourcemap.should.exist;
      return should.match_expected(this.coffee, res.result, lpath);
    });
  });
});

describe('stylus', () => {
  before(function () {
    this.stylus = accord.load('stylus');
    return (this.path = path.join(__dirname, 'fixtures', 'stylus'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.stylus.extensions.should.be.an.instanceOf(Array);
    this.stylus.output.should.be.a('string');
    this.stylus.engine.should.be.ok;
    return this.stylus.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.stylus
      .render('.test\n  foo: bar')
      .then(res =>
        should.match_expected(this.stylus, res.result, path.join(this.path, 'string.styl'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.styl');
    return this.stylus
      .renderFile(lpath)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.stylus.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should set normal options', function () {
    const opts = {
      paths: ['pluginz'],
      foo: 'bar',
    };

    const lpath = path.join(this.path, 'include1.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should correctly import css files', function () {
    const opts = { 'include css': true };

    const lpath = path.join(this.path, 'include_css.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set vanilla url function', function () {
    const opts = { url: 'embedurl' };

    const lpath = path.join(this.path, 'embedurl.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set url function with options', function () {
    const opts = {
      url: {
        name: 'embedurl',
        limit: 10,
      },
    };

    const lpath = path.join(this.path, 'embedurl.styl');
    const epath = path.join(this.path, 'embedurl-opts.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, epath));
  });

  it('should set defines', function () {
    const opts = { define: { foo: 'bar', baz: 'quux' } };

    return this.stylus
      .render('.test\n  test: foo', opts)
      .then(res =>
        should.match_expected(this.stylus, res.result, path.join(this.path, 'defines.styl'))
      );
  });

  it('should set raw defines', function () {
    const opts = { rawDefine: { rdefine: { blue1: '#0000FF' } } };

    const lpath = path.join(this.path, 'rawdefine.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set includes', function () {
    const opts = { include: 'pluginz' };

    const lpath = path.join(this.path, 'include1.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set multiple includes', function () {
    const opts = { include: ['pluginz', 'extra_plugin'] };

    const lpath = path.join(this.path, 'include2.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set imports', function () {
    const opts = { import: 'pluginz/lib' };

    const lpath = path.join(this.path, 'import1.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set multiple imports', function () {
    const opts = { import: ['pluginz/lib', 'pluginz/lib2'] };

    const lpath = path.join(this.path, 'import2.styl');
    return this.stylus
      .renderFile(lpath, opts)
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });

  it('should set plugins', function () {
    const opts = {
      use(style) {
        return style.define('main-width', 500);
      },
    };

    return this.stylus
      .render('.test\n  foo: main-width', opts)
      .then(res =>
        should.match_expected(this.stylus, res.result, path.join(this.path, 'plugins1.styl'))
      );
  });

  it('should set multiple plugins', function () {
    const opts = {
      use: [style => style.define('main-width', 500), style => style.define('main-height', 200)],
    };

    return this.stylus
      .render('.test\n  foo: main-width\n  bar: main-height', opts)
      .then(res =>
        should.match_expected(this.stylus, res.result, path.join(this.path, 'plugins2.styl'))
      );
  });

  it('should correctly handle errors', function () {
    return this.stylus
      .render("error('oh noes!')")
      .then(should.not.exist)
      .catch(x => x);
  });

  return it('should expose sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.styl');
    const opts = { sourcemap: true };

    return this.stylus
      .renderFile(lpath, opts)
      .tap((res) => {
        res.sourcemap.should.exist;
        res.sourcemap.version.should.equal(3);
        res.sourcemap.mappings.length.should.be.above(1);
        return res.sourcemap.sourcesContent.length.should.be.above(0);
      })
      .then(res => should.match_expected(this.stylus, res.result, lpath));
  });
});

describe.skip('dot', () => {
  before(function () {
    this.dot = accord.load('dot');
    return (this.path = path.join(__dirname, 'fixtures', 'dot'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.dot.extensions.should.be.an.instanceOf(Array);
    this.dot.output.should.be.a('string');
    this.dot.engine.should.be.ok;
    return this.dot.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.dot
      .render("<div>Hi {{=it.name}}!</div><div>{{=it.age || ''}}</div>", { name: 'Jake', age: 31 })
      .then(res =>
        should.match_expected(this.dot, res.result, path.join(this.path, 'rstring.dot'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.dot');
    return this.dot
      .renderFile(lpath, { name: 'Jake', age: 31 })
      .then(res => should.match_expected(this.dot, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.dot
      .compile("<p>{{=it.title}}</p><p>{{=it.message || ''}}</p>")
      .then(res =>
        should.match_expected(
          this.dot,
          res.result({ title: 'precompilez', message: 'wow opts' }),
          path.join(this.path, 'pstring.dot')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.dot');
    return this.dot
      .compileFile(lpath)
      .then(res =>
        should.match_expected(
          this.dot,
          res.result({ title: 'precompilez', message: 'wow opts' }),
          lpath
        )
      );
  });

  // dot doesn't support external file requests out of the box. You have to write your own extension to load snippets.
  // try using the one found here https://github.com/olado/doT/blob/master/examples/withdoT.js
  it('should handle partial renders', function () {
    const lpath = path.join(this.path, 'partial.dot');
    return this.dot
      .renderFile(lpath, { name: 'Jake', age: 31 })
      .then(res => should.match_expected(this.dot, res.result, lpath));
  });

  it('should client-compile a string', function () {
    const input = `\
{{? it.name }}
<div>Oh, I love your name, {{=it.name}}!</div>
{{?? it.age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=it.age}} and still don't have a name?
{{?}}\
`;
    const target = path.join(this.path, 'cstring.dot');
    return this.dot
      .compileClient(input, { name: 'Jake', age: 31 })
      .then(res => should.match_expected(this.dot, res.result, target));
  });

  it('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.dot');

    return this.dot
      .compileFileClient(lpath, { name: 'Jake', age: 31 })
      .then(res => should.match_expected(this.dot, res.result, lpath));
  });

  it('should render with client side helpers', function () {
    const lpath = path.join(this.path, 'client-complex.dot');
    return this.dot.compileFileClient(lpath).then((res) => {
      const tpl_string = `${this.dot.clientHelpers()}; var tpl = ${res.result}; tpl({'name':'Jake','age':31})`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.dot, tpl, lpath);
    });
  });

  return it('should correctly handle errors', function () {
    return this.dot
      .render('<div>Hi {{=it.name()}}!</div>')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('ejs', () => {
  before(function () {
    this.ejs = accord.load('ejs');
    return (this.path = path.join(__dirname, 'fixtures', 'ejs'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.ejs.extensions.should.be.an.instanceOf(Array);
    this.ejs.output.should.be.a('string');
    this.ejs.engine.should.be.ok;
    return this.ejs.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.ejs
      .render('<p>ejs yah</p><p><%= foo%></p>', { foo: 'wow opts' })
      .then(res =>
        should.match_expected(this.ejs, res.result, path.join(this.path, 'rstring.ejs'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.ejs');
    return this.ejs
      .renderFile(lpath, { foo: 'wow opts' })
      .then(res => should.match_expected(this.ejs, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.ejs
      .compile('<p>precompilez</p><p><%= foo %></p>')
      .then(res =>
        should.match_expected(
          this.ejs,
          res.result({ foo: 'wow opts' }),
          path.join(this.path, 'pstring.ejs')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.ejs');
    return this.ejs
      .compileFile(lpath)
      .then(res => should.match_expected(this.ejs, res.result({ foo: 'wow opts' }), lpath));
  });

  it('should handle external file requests', function () {
    const lpath = path.join(this.path, 'partial.ejs');
    return this.ejs
      .renderFile(lpath)
      .then(res => should.match_expected(this.ejs, res.result, lpath));
  });

  it.skip('should client-compile a string', function () {
    return this.ejs
      .compileClient('Woah look, a <%= thing %>')
      .then(res =>
        should.match_expected(this.ejs, res.result, path.join(this.path, 'cstring.ejs'))
      );
  });

  // ejs writes the filename to the function, which makes this
  // not work cross-system as expected
  it.skip('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.ejs');
    return this.ejs
      .compileFileClient(lpath)
      .then(res => should.match_expected(this.ejs, res.result, lpath));
  });

  it('should render with client side helpers', function () {
    const lpath = path.join(this.path, 'client-complex.ejs');
    return this.ejs.compileFileClient(lpath).then((res) => {
      const tpl_string = `${this.ejs.clientHelpers()}; var tpl = ${res.result}; tpl({ foo: 'local' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.ejs, tpl, lpath);
    });
  });

  return it('should correctly handle errors', function () {
    return this.ejs
      .render('<%= wow() %>')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('eco', () => {
  before(function () {
    this.eco = accord.load('eco');
    return (this.path = path.join(__dirname, 'fixtures', 'eco'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.eco.extensions.should.be.an.instanceOf(Array);
    this.eco.output.should.be.a('string');
    this.eco.engine.should.be.ok;
    return this.eco.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.eco.render('<p>eco yah</p><p><%= @foo %></p>', { foo: 'wow opts' }).then((res) => {
      const tgt = path.join(this.path, 'rstring.eco');
      return should.match_expected(this.eco, res.result, tgt);
    });
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.eco');
    return this.eco
      .renderFile(lpath, { foo: 'wow opts' })
      .then(res => should.match_expected(this.eco, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.eco.compile('<p>precompilez</p><p><%= @foo %></p>').then((res) => {
      const tgt = path.join(this.path, 'pstring.eco');
      return should.match_expected(this.eco, res.result({ foo: 'wow opts' }), tgt);
    });
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.eco');
    return this.eco
      .compileFile(lpath)
      .then(res => should.match_expected(this.eco, res.result({ foo: 'wow opts' }), lpath));
  });

  it('should client-compile a string', function () {
    return this.eco.compileClient('Woah look, a <%= thing %>').then((res) => {
      const tgt = path.join(this.path, 'cstring.eco');
      return should.match_expected(this.eco, res.result, tgt);
    });
  });

  it('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.eco');
    return this.eco
      .compileFileClient(lpath)
      .then(res => should.match_expected(this.eco, res.result, lpath));
  });

  return it('should correctly handle errors', function () {
    return this.eco
      .render('<%= wow() %>')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('markdown', () => {
  before(function () {
    this.markdown = accord.load('markdown');
    return (this.path = path.join(__dirname, 'fixtures', 'markdown'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.markdown.extensions.should.be.an.instanceOf(Array);
    this.markdown.output.should.be.a('string');
    this.markdown.engine.should.be.ok;
    return this.markdown.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.markdown
      .render('hello **world**')
      .then(res =>
        should.match_expected(this.markdown, res.result, path.join(this.path, 'string.md'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.md');
    return this.markdown
      .renderFile(lpath)
      .then(res => should.match_expected(this.markdown, res.result, lpath));
  });

  it('should render with options', function () {
    const lpath = path.join(this.path, 'opts.md');
    return this.markdown
      .renderFile(lpath, { sanitize: true })
      .then(res => should.match_expected(this.markdown, res.result, lpath));
  });

  return it('should not be able to compile', function () {
    return this.markdown.compile().then(r => should.not.exist(r), r => should.exist(r));
  });
});

describe('minify-js', () => {
  before(function () {
    this.minifyjs = accord.load('minify-js');
    return (this.path = path.join(__dirname, 'fixtures', 'minify-js'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.minifyjs.extensions.should.be.an.instanceOf(Array);
    this.minifyjs.output.should.be.a('string');
    this.minifyjs.engine.should.be.ok;
    return this.minifyjs.name.should.be.ok;
  });

  it('should minify a string', function () {
    return this.minifyjs
      .render('var foo = "foobar";\nconsole.log(foo)')
      .then(res =>
        should.match_expected(this.minifyjs, res.result, path.join(this.path, 'string.js'))
      );
  });

  it('should minify a file', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.minifyjs
      .renderFile(lpath)
      .then(res => should.match_expected(this.minifyjs, res.result, lpath));
  });

  it('should minify with options', function () {
    const lpath = path.join(this.path, 'opts.js');
    return this.minifyjs
      .renderFile(lpath, { compress: false })
      .then(res => should.match_expected(this.minifyjs, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.minifyjs.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.minifyjs
      .render('@#$%#I$$N%NI#$%I$PQ')
      .then(should.not.exist)
      .catch(x => x);
  });

  return it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.minifyjs.renderFile(lpath, { sourcemap: true }).then((res) => {
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.minifyjs, res.result, lpath);
    });
  });
});

describe('minify-css', () => {
  before(function () {
    this.minifycss = accord.load('minify-css');
    return (this.path = path.join(__dirname, 'fixtures', 'minify-css'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.minifycss.extensions.should.be.an.instanceOf(Array);
    this.minifycss.output.should.be.a('string');
    this.minifycss.engine.should.be.ok;
    return this.minifycss.name.should.be.ok;
  });

  it('should minify a string', function () {
    return this.minifycss
      .render('.test {\n  foo: bar;\n}')
      .then(res =>
        should.match_expected(this.minifycss, res.result, path.join(this.path, 'string.css'))
      );
  });

  it('should minify a file', function () {
    const lpath = path.join(this.path, 'basic.css');
    return this.minifycss
      .renderFile(lpath)
      .then(res => should.match_expected(this.minifycss, res.result, lpath));
  });

  it('should minify with options', function () {
    const lpath = path.join(this.path, 'opts.css');
    return this.minifycss
      .renderFile(lpath, { keepBreaks: true })
      .then(res => should.match_expected(this.minifycss, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.minifycss.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.minifycss
      .render('FMWT$SP#TPO%M@#@#M!@@@')
      .then(r => r.result.should.equal(''), should.not.exist);
  });
});

describe('escape-html', () => {
  before(function () {
    this.escapeHtml = accord.load('escape-html');
    return (this.path = path.join(__dirname, 'fixtures', 'escape-html'));
  });

  it('should expose name, extensions, output, and compiler', function () {
    this.escapeHtml.extensions.should.be.an.instanceOf(Array);
    this.escapeHtml.output.should.be.a('string');
    this.escapeHtml.engine.should.be.ok;
    return this.escapeHtml.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.escapeHtml
      .render('<h1>§</h1>')
      .catch(should.not.exist)
      .then(res =>
        fs
          .readFileSync(path.join(this.path, 'expected', 'string.html'), 'utf8')
          .should.contain(res.result)
      );
  });
  it('should render a file without escaping anything', function () {
    const lpath = path.join(this.path, 'basic.html');
    return this.escapeHtml
      .renderFile(lpath)
      .catch(should.not.exist)
      .then(res => should.match_expected(this.escapeHtml, res.result, lpath));
  });

  return it('should escape content', function () {
    const lpath = path.join(this.path, 'escapable.html');
    return this.escapeHtml
      .renderFile(lpath)
      .catch(should.not.exist)
      .then(res => should.match_expected(this.escapeHtml, res.result, lpath));
  });
});

describe('minify-html', () => {
  before(function () {
    this.minifyhtml = accord.load('minify-html');
    return (this.path = path.join(__dirname, 'fixtures', 'minify-html'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.minifyhtml.extensions.should.be.an.instanceOf(Array);
    this.minifyhtml.output.should.be.a('string');
    this.minifyhtml.engine.should.be.ok;
    return this.minifyhtml.name.should.be.ok;
  });

  it('should minify a string', function () {
    return this.minifyhtml
      .render('<div class="hi" id="">\n  <p>hello</p>\n</div>')
      .then(res =>
        should.match_expected(this.minifyhtml, res.result, path.join(this.path, 'string.html'))
      );
  });

  it('should minify a file', function () {
    const lpath = path.join(this.path, 'basic.html');
    return this.minifyhtml
      .renderFile(lpath)
      .catch(err => console.log(err.stack))
      .then(res => should.match_expected(this.minifyhtml, res.result, lpath));
  });

  it('should minify with options', function () {
    const lpath = path.join(this.path, 'opts.html');
    return this.minifyhtml
      .renderFile(lpath, { collapseWhitespace: false })
      .then(res => should.match_expected(this.minifyhtml, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.minifyhtml.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.minifyhtml
      .render('<<<{@$@#$')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('csso', () => {
  before(function () {
    this.csso = accord.load('csso');
    return (this.path = path.join(__dirname, 'fixtures', 'csso'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.csso.extensions.should.be.an.instanceOf(Array);
    this.csso.output.should.be.a('string');
    this.csso.engine.should.be.ok;
    return this.csso.name.should.be.ok;
  });

  it('should minify a string', function () {
    return this.csso
      .render('.hello { foo: bar; }\n .hello { color: green }')
      .then(res =>
        should.match_expected(this.csso, res.result, path.join(this.path, 'string.css'))
      );
  });

  it('should minify a file', function () {
    const lpath = path.join(this.path, 'basic.css');
    return this.csso
      .renderFile(lpath)
      .then(res => should.match_expected(this.csso, res.result, lpath));
  });

  it('should minify with options', function () {
    const lpath = path.join(this.path, 'opts.css');
    return this.csso
      .renderFile(lpath, { restructuring: false })
      .then(res => should.match_expected(this.csso, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.csso.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.csso
      .render('wow')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('mustache', () => {
  before(function () {
    this.mustache = accord.load('mustache');
    return (this.path = path.join(__dirname, 'fixtures', 'mustache'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.mustache.extensions.should.be.an.instanceOf(Array);
    this.mustache.output.should.be.a('string');
    this.mustache.engine.should.be.ok;
    return this.mustache.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.mustache
      .render('Why hello, {{ name }}!', { name: 'dogeudle' })
      .then(res =>
        should.match_expected(this.mustache, res.result, path.join(this.path, 'string.mustache'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.mustache');
    return this.mustache
      .renderFile(lpath, { name: 'doge', winner: true })
      .then(res => should.match_expected(this.mustache, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.mustache
      .compile('Wow, such {{ noun }}')
      .then(res =>
        should.match_expected(
          this.mustache,
          res.result.render({ noun: 'compile' }),
          path.join(this.path, 'pstring.mustache')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.mustache');
    return this.mustache
      .compileFile(lpath)
      .then(res => should.match_expected(this.mustache, res.result.render({ name: 'foo' }), lpath));
  });

  it('client compile should work', function () {
    const lpath = path.join(this.path, 'client-complex.mustache');
    return this.mustache.compileFileClient(lpath).then((res) => {
      const tpl_string = `${this.mustache.clientHelpers()}; var tpl = ${res.result} tpl.render({ wow: 'local' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.mustache, tpl, lpath);
    });
  });

  it('should handle partials', function () {
    const lpath = path.join(this.path, 'partial.mustache');
    return this.mustache
      .renderFile(lpath, { foo: 'bar', partials: { partial: 'foo {{ foo }}' } })
      .then(res => should.match_expected(this.mustache, res.result, lpath));
  });

  return it('should correctly handle errors', function () {
    return this.mustache
      .render('{{# !@{!# }}')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('dogescript', () => {
  before(function () {
    this.doge = accord.load('dogescript');
    return (this.path = path.join(__dirname, 'fixtures', 'dogescript'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.doge.extensions.should.be.an.instanceOf(Array);
    this.doge.output.should.be.a('string');
    this.doge.engine.should.be.ok;
    return this.doge.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.doge
      .render("console dose loge with 'wow'", { beautify: true })
      .then(res =>
        should.match_expected(this.doge, res.result, path.join(this.path, 'string.djs'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.djs');
    return this.doge
      .renderFile(lpath, { trueDoge: true })
      .then(res => should.match_expected(this.doge, res.result, lpath));
  });

  return it('should not be able to compile', function () {
    return this.doge.compile().then(r => should.not.exist(r), r => should.exist(r));
  });
});

// it turns out that it's impossible for dogescript to throw an error
// which, honestly, is how it should be. so no test here.

describe('handlebars', () => {
  before(function () {
    this.handlebars = accord.load('handlebars');
    return (this.path = path.join(__dirname, 'fixtures', 'handlebars'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.handlebars.extensions.should.be.an.instanceOf(Array);
    this.handlebars.output.should.be.a('string');
    this.handlebars.engine.should.be.ok;
    return this.handlebars.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.handlebars
      .render('Hello there {{ name }}', { name: 'homie' })
      .then(res =>
        should.match_expected(this.handlebars, res.result, path.join(this.path, 'rstring.hbs'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.hbs');
    return this.handlebars
      .renderFile(lpath, { compiler: 'handlebars' })
      .then(res => should.match_expected(this.handlebars, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.handlebars
      .compile('Hello there {{ name }}')
      .then(res =>
        should.match_expected(
          this.handlebars,
          res.result({ name: 'my friend' }),
          path.join(this.path, 'pstring.hbs')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.hbs');
    return this.handlebars
      .compileFile(lpath)
      .then(res =>
        should.match_expected(this.handlebars, res.result({ friend: 'r kelly' }), lpath)
      );
  });

  it('should client-compile a string', function () {
    return this.handlebars
      .compileClient('Here comes the {{ thing }}')
      .then(res =>
        should.match_expected(this.handlebars, res.result, path.join(this.path, 'cstring.hbs'))
      );
  });

  it('should client-compile a file', function () {
    const lpath = path.join(this.path, 'client.hbs');
    return this.handlebars
      .compileFileClient(lpath)
      .then(res => should.match_expected(this.handlebars, res.result, lpath));
  });

  it('should handle external file requests', function () {
    const lpath = path.join(this.path, 'partial.hbs');
    return this.handlebars
      .renderFile(lpath, { partials: { foo: '<p>hello from a partial!</p>' } })
      .then(res => should.match_expected(this.handlebars, res.result, lpath));
  });

  it('should render with client side helpers', function () {
    const lpath = path.join(this.path, 'client-complex.hbs');
    return this.handlebars.compileFileClient(lpath).then((res) => {
      const tpl_string = `${this.handlebars.clientHelpers()}; var tpl = ${res.result}; tpl({ wow: 'local' })`;
      const tpl = eval.call(global, tpl_string);
      return should.match_expected(this.handlebars, tpl, lpath);
    });
  });

  return it('should correctly handle errors', function () {
    return this.handlebars
      .render('{{# !@{!# }}')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('scss', () => {
  before(function () {
    this.scss = accord.load('scss');
    return (this.path = path.join(__dirname, 'fixtures', 'scss'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.scss.extensions.should.be.an.instanceOf(Array);
    this.scss.output.should.be.a('string');
    this.scss.engine.should.be.ok;
    return this.scss.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.scss
      .render("$wow: 'red'; foo { bar: $wow; }")
      .then(res =>
        should.match_expected(this.scss, res.result, path.join(this.path, 'string.scss'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.scss');
    return this.scss
      .renderFile(lpath, { trueDoge: true })
      .then(res => should.match_expected(this.scss, res.result, lpath));
  });

  it('should include external files', function () {
    const lpath = path.join(this.path, 'external.scss');
    return this.scss
      .renderFile(lpath, { includePaths: [this.path] })
      .then(res => should.match_expected(this.scss, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.scss.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.scss
      .render('!@##%#$#^$')
      .then(should.not.exist)
      .catch(x => x);
  });

  it('should generate a sourcemap', function () {
    const lpath = path.join(this.path, 'basic.scss');
    return this.scss
      .renderFile(lpath, { sourcemap: true })
      .tap((res) => {
        res.sourcemap.version.should.equal(3);
        res.sourcemap.mappings.length.should.be.above(1);
        res.sourcemap.sources[0].should.equal(lpath);
        return res.sourcemap.sourcesContent.length.should.be.above(0);
      })
      .then(res => should.match_expected(this.scss, res.result, lpath));
  });

  it('should generate a sourcemap with correct sources', function () {
    const lpath = path.join(this.path, 'external.scss');
    const mixinpath = path.join(this.path, '_mixin_lib.scss');
    return this.scss
      .renderFile(lpath, { sourcemap: true })
      .tap((res) => {
        res.sourcemap.version.should.equal(3);
        res.sourcemap.mappings.length.should.be.above(1);
        res.sourcemap.sources.length.should.equal(2);
        res.sourcemap.sources[0].should.equal(lpath);
        res.sourcemap.sources[1].should.equal(mixinpath);
        return res.sourcemap.sourcesContent.length.should.equal(2);
      })
      .then(res => should.match_expected(this.scss, res.result, lpath));
  });

  return it('should generate a sourcemap with correct relative sources', function () {
    const lpath = path.join(this.path, 'external.scss');
    const mixinpath = path.join(this.path, '_mixin_lib.scss');
    return this.scss
      .renderFile(lpath, { sourcemap: lpath })
      .tap((res) => {
        res.sourcemap.version.should.equal(3);
        res.sourcemap.mappings.length.should.be.above(1);
        res.sourcemap.sources.length.should.equal(2);
        res.sourcemap.sources[0].should.equal('external.scss');
        res.sourcemap.sources[1].should.equal('_mixin_lib.scss');
        return res.sourcemap.sourcesContent.length.should.equal(2);
      })
      .then(res => should.match_expected(this.scss, res.result, lpath));
  });
});

describe('less', () => {
  before(function () {
    this.less = accord.load('less');
    return (this.path = path.join(__dirname, 'fixtures', 'less'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.less.extensions.should.be.an.instanceOf(Array);
    this.less.output.should.be.a('string');
    this.less.engine.should.be.ok;
    return this.less.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.less
      .render('.foo { width: 100 + 20 }')
      .then(res =>
        should.match_expected(this.less, res.result, path.join(this.path, 'string.less'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.less');
    return this.less
      .renderFile(lpath, { trueDoge: true })
      .then(res => should.match_expected(this.less, res.result, lpath));
  });

  it('should include external files', function () {
    const lpath = path.join(this.path, 'external.less');
    return this.less
      .renderFile(lpath, { paths: [this.path] })
      .then(res => should.match_expected(this.less, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.less.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle parse errors', function () {
    return this.less
      .render('!@##%#$#^$')
      .then(should.not.exist)
      .catch(x => x);
  });

  it('should correctly handle tree resolution errors', function () {
    return this.less
      .render(
        `\
.foo {
  .notFound()
}\
`
      )
      .then(should.not.exist)
      .catch(x => x);
  });

  winSkip('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.less');
    return this.less.renderFile(lpath, { sourcemap: true }).then((res) => {
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.less, res.result, lpath);
    });
  });

  return it('should accept sourcemap overrides', function () {
    const lpath = path.join(this.path, 'basic.less');
    return this.less
      .renderFile(lpath, {
        sourceMap: { sourceMapBasepath: 'test/fixtures/less/basic.less' },
        filename: 'basic.less',
      })
      .then((res) => {
        res.sourcemap.version.should.equal(3);
        res.sourcemap.sources[0].should.equal('basic.less');
        return should.not.exist(res.sourcemap.sourcesContent);
      });
  });
});

describe('coco', () => {
  before(function () {
    this.coco = accord.load('coco');
    return (this.path = path.join(__dirname, 'fixtures', 'coco'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.coco.extensions.should.be.an.instanceOf(Array);
    this.coco.output.should.be.a('string');
    this.coco.engine.should.be.ok;
    return this.coco.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.coco
      .render("function test\n  console.log('foo')", { bare: true })
      .then(res => should.match_expected(this.coco, res.result, path.join(this.path, 'string.co')));
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.co');
    return this.coco
      .renderFile(lpath)
      .then(res => should.match_expected(this.coco, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.coco.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.coco
      .render('!! ---  )I%$_(I(YRTO')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('livescript', () => {
  before(function () {
    this.livescript = accord.load('LiveScript');
    return (this.path = path.join(__dirname, 'fixtures', 'livescript'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.livescript.extensions.should.be.an.instanceOf(Array);
    this.livescript.output.should.be.a('string');
    this.livescript.engine.should.be.ok;
    return this.livescript.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.livescript
      .render("test = ~> console.log('foo')", { bare: true })
      .then(res =>
        should.match_expected(this.livescript, res.result, path.join(this.path, 'string.ls'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.ls');
    return this.livescript
      .renderFile(lpath)
      .then(res => should.match_expected(this.livescript, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.livescript.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.livescript
      .render('!! ---  )I%$_(I(YRTO')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('typescript', () => {
  before(function () {
    this.typescript = accord.load('typescript', undefined, 'typescript-compiler');
    return (this.path = path.join(__dirname, 'fixtures', 'typescript'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.typescript.extensions.should.be.an.instanceOf(Array);
    this.typescript.output.should.be.a('string');
    this.typescript.engine.should.be.ok;
    return this.typescript.name.should.be.ok;
  });

  winSkip('should render a string', function () {
    return this.typescript
      .render('var n:number = 42; console.log(n)', { bare: true })
      .then(res =>
        should.match_expected(this.typescript, res.result, path.join(this.path, 'string.ts'))
      );
  });

  winSkip('should render a file', function () {
    const lpath = path.join(this.path, 'basic.ts');
    return this.typescript
      .renderFile(lpath)
      .then(res => should.match_expected(this.typescript, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.typescript.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.typescript
      .render('!! ---  )I%$_(I(YRTO')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe.skip('myth', () => {
  before(function () {
    this.myth = accord.load('myth');
    return (this.path = path.join(__dirname, 'fixtures', 'myth'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.myth.extensions.should.be.an.instanceOf(Array);
    this.myth.output.should.be.a('string');
    this.myth.engine.should.be.ok;
    return this.myth.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.myth
      .render('.foo { transition: all 1s ease; }')
      .then(res =>
        should.match_expected(this.myth, res.result, path.join(this.path, 'string.myth'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.myth');
    return this.myth
      .renderFile(lpath)
      .then(res => should.match_expected(this.myth, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.myth.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.myth
      .render('!! ---  )I%$_(I(YRTO')
      .then(should.not.exist)
      .catch(x => x);
  });

  return it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.myth');
    return this.myth.renderFile(lpath, { sourcemap: true }).then((res) => {
      res.sourcemap.should.be.an('object');
      res.sourcemap.version.should.equal(3);
      res.sourcemap.sources.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.myth, res.result, lpath);
    });
  });
});

describe('haml', () => {
  before(function () {
    this.haml = accord.load('haml');
    return (this.path = path.join(__dirname, 'fixtures', 'haml'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.haml.extensions.should.be.an.instanceOf(Array);
    this.haml.output.should.be.a('string');
    this.haml.engine.should.be.ok;
    return this.haml.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.haml
      .render('%div.foo= "Whats up " + name', { name: 'mang' })
      .then(res =>
        should.match_expected(this.haml, res.result, path.join(this.path, 'rstring.haml'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.haml');
    return this.haml
      .renderFile(lpath, { compiler: 'haml' })
      .then(res => should.match_expected(this.haml, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.haml
      .compile('%p= "Hello there " + name')
      .then(res =>
        should.match_expected(
          this.haml,
          res.result({ name: 'my friend' }),
          path.join(this.path, 'pstring.haml')
        )
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'precompile.haml');
    return this.haml
      .compileFile(lpath)
      .then(res => should.match_expected(this.haml, res.result({ friend: 'doge' }), lpath));
  });

  it('should not support client compiles', function () {
    return this.haml
      .compileClient("%p= 'Here comes the ' + thing")
      .then(r => should.not.exist(r), r => should.exist(r));
  });

  return it('should correctly handle errors', function () {
    return this.haml
      .render('%p= wow()')
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe.skip('marc', () => {
  before(function () {
    this.marc = accord.load('marc');
    return (this.path = path.join(__dirname, 'fixtures', 'marc'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.marc.extensions.should.be.an.instanceOf(Array);
    this.marc.output.should.be.a('string');
    this.marc.engine.should.be.ok;
    return this.marc.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.marc
      .render('I am using __markdown__ with {{label}}!', {
        data: {
          label: 'marc',
        },
      })
      .catch(should.not.exist)
      .then(res => should.match_expected(this.marc, res.result, path.join(this.path, 'basic.md')));
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.md');
    return this.marc
      .renderFile(lpath, { data: { label: 'marc' } })
      .then(res => should.match_expected(this.marc, res.result, lpath));
  });

  return it('should not be able to compile', function () {
    return this.marc.compile().then(r => should.not.exist(r), r => should.exist(r));
  });
});

describe('toffee', () => {
  before(function () {
    this.toffee = accord.load('toffee');
    return (this.path = path.join(__dirname, 'fixtures', 'toffee'));
  });

  it('should expose name, extensions, output, and compiler', function () {
    this.toffee.extensions.should.be.an.instanceOf(Array);
    this.toffee.output.should.be.a('string');
    this.toffee.engine.should.be.ok;
    return this.toffee.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.toffee
      .render(
        `\
{#
  for supply in supplies {:<li>#{supply}</li>:}
#}\
`,
        { supplies: ['mop', 'trash bin', 'flashlight'] }
      )
      .catch(should.not.exist)
      .then(res =>
        should.match_expected(this.toffee, res.result, path.join(this.path, 'basic.toffee'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.toffee');
    return this.toffee
      .renderFile(lpath, { supplies: ['mop', 'trash bin', 'flashlight'] })
      .catch(should.not.exist)
      .then(res => should.match_expected(this.toffee, res.result, lpath));
  });

  it('should compile a string', function () {
    return this.toffee
      .compile(
        `\
{#
  for supply in supplies {:<li>#{supply}</li>:}
#}\
`,
        { supplies: ['mop', 'trash bin', 'flashlight'] }
      )
      .then(res =>
        should.match_expected(this.toffee, res.result, path.join(this.path, 'template.toffee'))
      );
  });

  it('should compile a file', function () {
    const lpath = path.join(this.path, 'template.toffee');
    return this.toffee
      .compileFile(lpath, { supplies: ['mop', 'trash bin', 'flashlight'] })
      .then(res => should.match_expected(this.toffee, res.result, lpath));
  });

  it('should client-compile a string', function () {
    return this.toffee
      .compileClient(
        `\
{#
  for supply in supplies {:<li>#{supply}</li>:}
#}\
`,
        {}
      )
      .then(res =>
        should.match_expected(this.toffee, res.result, path.join(this.path, 'my_templates.toffee'))
      );
  });

  it('should client-compile a string without headers', function () {
    return this.toffee
      .compileClient(
        `\
{#
  for supply in supplies {:<li>#{supply}</li>:}
#}\
`,
        { headers: false }
      )
      .then(res =>
        should.match_expected(
          this.toffee,
          res.result,
          path.join(this.path, 'no-header-templ.toffee')
        )
      );
  });

  winSkip('should client-compile a file', function () {
    const lpath = path.join(path.relative(process.cwd(), this.path), 'my_templates-2.toffee');
    return this.toffee
      .compileFileClient(lpath, {})
      .then(res => should.match_expected(this.toffee, res.result, lpath));
  });

  return it('should handle errors', function () {
    return this.toffee
      .render(
        `\
{#
  for supply in supplies {:<li>#{supply}</li>
#}\
`,
        {}
      )
      .then(should.not.exist)
      .catch(x => x);
  });
});

describe('babel', () => {
  before(function () {
    this.babel = accord.load('babel');
    return (this.path = path.join(__dirname, 'fixtures', 'babel'));
  });

  it('should expose name, extensions, output, and compiler', function () {
    this.babel.extensions.should.be.an.instanceOf(Array);
    this.babel.output.should.be.a('string');
    this.babel.engine.should.be.ok;
    return this.babel.name.should.be.ok;
  });

  it('should render a string', function () {
    const p = path.join(this.path, 'string.js');
    return this.babel
      .render("console.log('foo');", { presets: ['es2015'] })
      .catch(should.not.exist)
      .then(res => should.match_expected(this.babel, res.result, p));
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.babel
      .renderFile(lpath, { presets: ['es2015'] })
      .catch(should.not.exist)
      .then(res => should.match_expected(this.babel, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.babel.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.babel
      .render('!   ---@#$$@%#$')
      .then(should.not.exist)
      .catch(x => x);
  });

  it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.babel.renderFile(lpath, { presets: ['es2015'], sourcemap: true }).then((res) => {
      res.sourcemap.should.exist;
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.babel, res.result, lpath);
    });
  });

  return it("should not allow keys outside of babel's options", function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.babel
      .renderFile(lpath, { presets: ['es2015'], foobar: 'wow' })
      .catch(should.not.exist)
      .then(res => should.match_expected(this.babel, res.result, lpath));
  });
});

describe('buble', () => {
  before(function () {
    this.buble = accord.load('buble');
    return (this.path = path.join(__dirname, 'fixtures', 'buble'));
  });

  it('should expose name, extensions, output, and compiler', function () {
    this.buble.extensions.should.be.an.instanceOf(Array);
    this.buble.output.should.be.a('string');
    this.buble.engine.should.be.ok;
    return this.buble.name.should.be.ok;
  });

  it('should render a string', function () {
    const p = path.join(this.path, 'string.js');
    return this.buble
      .render("console.log('foo');")
      .catch(should.not.exist)
      .then(res => should.match_expected(this.buble, res.result, p));
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.buble
      .renderFile(lpath)
      .catch(should.not.exist)
      .then(res => should.match_expected(this.buble, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.buble.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.buble
      .render('!   ---@#$$@%#$')
      .then(should.not.exist)
      .catch(x => x);
  });

  return winSkip('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.js');
    return this.buble.renderFile(lpath).then((res) => {
      res.sourcemap.should.exist;
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.buble, res.result, lpath);
    });
  });
});

describe('jsx', () => {
  before(function () {
    this.jsx = accord.load('jsx');
    return (this.path = path.join(__dirname, 'fixtures', 'jsx'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.jsx.extensions.should.be.an.instanceOf(Array);
    this.jsx.output.should.be.a('string');
    this.jsx.engine.should.be.ok;
    return this.jsx.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.jsx
      .render('<div className="foo">{this.props.bar}</div>', { bare: true })
      .then(res => should.match_expected(this.jsx, res.result, path.join(this.path, 'string.jsx')));
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.jsx');
    return this.jsx
      .renderFile(lpath)
      .then(res => should.match_expected(this.jsx, res.result, lpath));
  });

  it('should not be able to compile', function () {
    return this.jsx.compile().then(r => should.not.exist(r), r => should.exist(r));
  });

  it('should correctly handle errors', function () {
    return this.jsx
      .render('!   ---@#$$@%#$')
      .then(should.not.exist)
      .catch(x => x);
  });

  return it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.jsx');
    return this.jsx.renderFile(lpath, { sourcemap: true }).then((res) => {
      res.sourcemap.should.exist;
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      res.sourcemap.sources[0].should.equal(lpath);
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.jsx, res.result, lpath);
    });
  });
});

describe('cjsx', () => {
  before(function () {
    this.cjsx = accord.load('cjsx');
    return (this.path = path.join(__dirname, 'fixtures', 'cjsx'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.cjsx.extensions.should.be.an.instanceOf(Array);
    this.cjsx.output.should.be.a('string');
    this.cjsx.engine.should.be.ok;
    return this.cjsx.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.cjsx
      .render('<div className="foo"></div>')
      .then(res =>
        should.match_expected(this.cjsx, res.result, path.join(this.path, 'string.cjsx'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.cjsx');
    return this.cjsx
      .renderFile(lpath)
      .then(res => should.match_expected(this.cjsx, res.result, lpath));
  });

  return it('should not be able to compile', function () {
    return this.cjsx.compile().then(r => should.not.exist(r), r => should.exist(r));
  });
});

describe('postcss', () => {
  before(function () {
    this.postcss = accord.load('postcss');
    return (this.path = path.join(__dirname, 'fixtures', 'postcss'));
  });

  it('should expose name, extensions, output, and engine', function () {
    this.postcss.extensions.should.be.an.instanceOf(Array);
    this.postcss.output.should.be.a('string');
    this.postcss.engine.should.be.ok;
    return this.postcss.name.should.be.ok;
  });

  it('should render a string', function () {
    return this.postcss
      .render('.test { color: green; }')
      .then(res =>
        should.match_expected(this.postcss, res.result, path.join(this.path, 'string.css'))
      );
  });

  it('should render a file', function () {
    const lpath = path.join(this.path, 'basic.css');
    return this.postcss
      .renderFile(lpath)
      .then(res => should.match_expected(this.postcss, res.result, lpath));
  });

  it('should render a file with plugin', function () {
    const lpath = path.join(this.path, 'var.css');
    const varsPlugin = require('postcss-simple-vars');
    return this.postcss
      .renderFile(lpath, { use: [varsPlugin] })
      .then(res => should.match_expected(this.postcss, res.result, lpath));
  });

  it('should generate sourcemaps', function () {
    const lpath = path.join(this.path, 'basic.css');
    const opts = { map: true };
    return this.postcss.renderFile(lpath, opts).then((res) => {
      res.sourcemap.should.exist;
      res.sourcemap.version.should.equal(3);
      res.sourcemap.mappings.length.should.be.above(1);
      // postcss converts the absolute path to a relative path
      // res.sourcemap.sources[0].should.equal(lpath)
      res.sourcemap.sourcesContent.length.should.be.above(0);
      return should.match_expected(this.postcss, res.result, lpath);
    });
  });

  return it('should correctly handle errors', function () {
    return this.postcss
      .render('.test { ')
      .then(should.not.exist)
      .catch(x => x);
  });
});

function __range__(left, right, inclusive) {
  const range = [];
  const ascending = left < right;
  const end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
