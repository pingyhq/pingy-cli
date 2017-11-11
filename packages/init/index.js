'use strict';

const path = require('upath');
const scaffoldPrimitive = require('@pingy/scaffold-primitive');

const babelPolyfillPath = require.resolve('babel-polyfill/dist/polyfill.js');
const normalizeCssPath = require.resolve('normalize.css/normalize.css');
const babelRCPath = require.resolve('./templates/.babelrc');
const compilerMap = require('./compilerMap');

const join = path.join;
const templatesDir = join(__dirname, 'templates');

const defaults = {
  html: {
    file: 'index',
    type: 'html', // or 'jade'
  },
  styles: {
    folder: 'styles',
    file: 'main',
    type: 'css', // or 'scss', 'sass', 'less', 'styl'
  },
  scripts: {
    folder: 'scripts',
    file: 'main',
    type: 'js', // or 'babel', 'coffee'
  },
};

const fileMap = {
  html: {
    html(name) {
      return `${name || defaults.html.file}.html`;
    },
    jade(name) {
      return `${name || defaults.html.file}.jade`;
    },
    pug(name) {
      return `${name || defaults.html.file}.pug`;
    },
    ejs(name) {
      return `${name || defaults.html.file}.ejs`;
    },
  },
  styles: {
    css(name, dir) {
      return join(dir || defaults.styles.folder, `${name || defaults.styles.file}.css`);
    },
    less(name, dir) {
      return join(dir || defaults.styles.folder, `${name || defaults.styles.file}.less`);
    },
    sass(name, dir) {
      return join(dir || defaults.styles.folder, `${name || defaults.styles.file}.sass`);
    },
    scss(name, dir) {
      return join(dir || defaults.styles.folder, `${name || defaults.styles.file}.scss`);
    },
    styl(name, dir) {
      return join(dir || defaults.styles.folder, `${name || defaults.styles.file}.styl`);
    },
  },
  scripts: {
    js(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.js`);
    },
    babel(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.babel.js`);
    },
    buble(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.buble.js`);
    },
    coffee(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.coffee`);
    },
    ls(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.ls`);
    },
    djs(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.djs`);
    },
    ts(name, dir) {
      return join(dir || defaults.scripts.folder, `${name || defaults.scripts.file}.ts`);
    },
  },
};
const nameToObj = (type, ext) => compilerMap[type].find(x => x.extension === ext) || {};

/**
 * Transform options a project for use with scaffold-primitive
 * @param  {Object} options
 *     {
 *       html: {
 *         file: 'index',
 *         type: 'html', // or 'jade'
 *       },
 *       styles: {
 *         folder: 'styles',
 *         file: 'main',
 *         type: 'css', // or 'scss', 'sass', 'less', 'styl'
 *       },
 *       scripts: {
 *         folder: 'scripts',
 *         file: 'main',
 *         type: 'js', // or 'babel', 'coffee'
 *       },
 *      babelPolyfill: true/false, // include babel polyfill?
 *      normalizeCss: true/false, // include CSS normalizer file?
 *      whitespace: 'tabs', // Pass in a number (e.g. 2) to use spaces
 *                          // for whitespace, otherwise tabs will be used
 *    }
 *
 * @return {Object}   options compatible with scaffold-primitive
 */
function transformOptions(options) {
  const settings = Object.assign({}, defaults, options, {
    html: Object.assign({}, defaults.html, options.html),
    styles: Object.assign({}, defaults.styles, options.styles),
    scripts: Object.assign({}, defaults.scripts, options.scripts),
  });

  const depsObj = {
    html: nameToObj('docs', settings.html.type),
    css: nameToObj('styles', settings.styles.type),
    js: nameToObj('scripts', settings.scripts.type),
  };

  const files = [];

  if (settings.babelPolyfill) {
    files.push({
      input: babelPolyfillPath,
      output: join(settings.scripts.folder, 'polyfill.js'),
    });
  }
  if (settings.normalizeCss) {
    files.push({
      input: normalizeCssPath,
      output: join(settings.styles.folder, 'normalize.css'),
    });
  }

  if (settings.scripts.type === 'babel') {
    files.push({
      input: babelRCPath,
      output: '.babelrc',
    });
  }

  files.push({
    input: fileMap.html[settings.html.type](defaults.html.file),
    vars: {
      styles: settings.styles,
      scripts: settings.scripts,
      babelPolyfill: options.babelPolyfill,
      normalizeCss: options.normalizeCss,
    },
    output: fileMap.html[settings.html.type](settings.html.file),
  });

  files.push({
    input: fileMap.scripts[settings.scripts.type](defaults.scripts.file, defaults.scripts.folder),
    output: fileMap.scripts[settings.scripts.type](settings.scripts.file, settings.scripts.folder),
  });

  files.push({
    input: fileMap.styles[settings.styles.type](defaults.styles.file, defaults.styles.folder),
    output: fileMap.styles[settings.styles.type](settings.styles.file, settings.styles.folder),
  });

  const devDependencies = Object.assign(
    {},
    depsObj.html.module,
    depsObj.css.module,
    depsObj.js.module
  );

  return {
    files,
    devDependencies,
    whitespace: options.whitespace,
  };
}

module.exports.scaffold = function scaffold(projectDir, options) {
  return scaffoldPrimitive.scaffold(templatesDir, projectDir, options);
};

module.exports.preflight = function preflight(projectDir, options) {
  return scaffoldPrimitive.preflight(templatesDir, projectDir, options);
};

module.exports.transformOptions = transformOptions;
