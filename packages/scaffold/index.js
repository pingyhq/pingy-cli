'use strict';

const path = require('upath');
const checkdir = require('checkdir');
const scaffoldPrimitive = require('@pingy/scaffold-primitive');

const babelPolyfillPath = require.resolve('babel-polyfill/dist/polyfill.js');
const normalizeCssPath = require.resolve('normalize.css/normalize.css');
const babelRCPath = require.resolve('./templates/.babelrc');

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
  babelPolyfill: false,
  normalizeCss: false,
  whitespaceFormatting: 'tabs',
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

function transformOptions(options) {
  const settings = Object.assign({}, defaults, options, {
    html: Object.assign({}, defaults.html, options.html),
    styles: Object.assign({}, defaults.styles, options.styles),
    scripts: Object.assign({}, defaults.scripts, options.scripts),
  });

  const transformedOptions = {
    copy: [],
    templates: [],
    whitespace: settings.whitespaceFormatting,
  };

  if (settings.babelPolyfill) {
    transformedOptions.copy.push({
      input: babelPolyfillPath,
      output: join(settings.scripts.folder, 'polyfill.js'),
    });
  }
  if (settings.normalizeCss) {
    transformedOptions.copy.push({
      input: normalizeCssPath,
      output: join(settings.styles.folder, 'normalize.css'),
    });
  }
  if (settings.scripts.type === 'babel') {
    transformedOptions.copy.push({
      input: babelRCPath,
      output: '.babelrc',
    });
  }

  transformedOptions.templates.push({
    input: fileMap.html[settings.html.type](defaults.html.file),
    vars: {
      babelPolyfill: settings.babelPolyfill,
      normalizeCss: settings.normalizeCss,
      styles: settings.styles,
      scripts: settings.scripts,
    },
    output: fileMap.html[settings.html.type](settings.html.file),
  });

  transformedOptions.copy.push({
    input: fileMap.scripts[settings.scripts.type](defaults.scripts.file, defaults.scripts.folder),
    output: fileMap.scripts[settings.scripts.type](settings.scripts.file, settings.scripts.folder),
  });

  transformedOptions.copy.push({
    input: fileMap.styles[settings.styles.type](defaults.styles.file, defaults.styles.folder),
    output: fileMap.styles[settings.styles.type](settings.styles.file, settings.styles.folder),
  });
  return transformedOptions;
}

/**
 * Barnyard - Bootstrap/Scaffold a project for use with Piggy in the Middle and Baconize
 * @param  {string} projectDir Directory to scaffold the generated project to
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
 *      whitespaceFormatting: 'tabs', // Pass in a number (e.g. 2) to use spaces
 *                                    // for whitespace, otherwise tabs will be used
 *    }
 *
 * @return {Promise<Array[string]>}   Files created during scaffolding
 */
module.exports = function barnyard(projectDir, options) {
  return scaffoldPrimitive(templatesDir, projectDir, transformOptions(options));
};

module.exports.preflight = function preflight(filePath, options) {
  return checkdir(filePath, { ignoreDotFiles: true }).then((dirInfo) => {
    if (!dirInfo.exists || typeof options !== 'object') return dirInfo;
    return scaffoldPrimitive
      .preflight(templatesDir, filePath, transformOptions(options))
      .then(outputFiles =>
        Object.assign(dirInfo, {
          preparedFiles: outputFiles,
        })
      );
  });
};
