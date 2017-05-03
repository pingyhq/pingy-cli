'use strict';

var fs = require('mz/fs');
var mark = require('markup-js');
var detab = require('detab');
var path = require('path');
var getDirName = path.dirname;
var join = path.join;
var deepAssign = require('deep-extend');
var checkdir = require('checkdir');
var thenify = require('thenify');
var mkdirp = thenify(require('mkdirp'));
var readFile = fs.readFile;
var writeFile = fs.writeFile;
var babelPolyfillPath = require.resolve('babel-polyfill/dist/polyfill.js');
var normalizeCssPath = require.resolve('normalize.css/normalize.css');
var babelRCPath = require.resolve('./templates/.babelrc');

var templatesDir = join(__dirname, 'templates');

var defaults = {
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

var fileMap = {
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

function prepareFiles(options) {
  function formatOutputObject(inputFile, outputFilename, requiresTemplating) {
    return inputFile.then((data) => {
      if (requiresTemplating) {
        data = mark.up(data, options);
      }
      if (
        typeof options.whitespaceFormatting === 'number' ||
        !isNaN(options.whitespaceFormatting)
      ) {
        data = detab(data, parseInt(options.whitespaceFormatting, 10));
      }
      return {
        data,
        path: outputFilename,
      };
    });
  }

  function getFile(filename, outputPath) {
    var inputFile = readFile(filename, 'utf8');
    return formatOutputObject(inputFile, outputPath);
  }

  function getTemplateFile(inputFilename, outputFilename, requiresTemplating) {
    var inputFile = readFile(join(templatesDir, inputFilename), 'utf8');
    return formatOutputObject(inputFile, outputFilename, requiresTemplating);
  }

  function prepareHtml() {
    var htmlLang = options.html.type;
    var inputFilename = fileMap.html[htmlLang]();
    var outputFilename = fileMap.html[htmlLang](options.html.file);
    // HTML files require templating through marked.js so add `true` param
    return getTemplateFile(inputFilename, outputFilename, true);
  }

  function prepareStyles() {
    var cssLang = options.styles.type;
    var inputFilename = fileMap.styles[cssLang]();
    var outputFilename = fileMap.styles[cssLang](options.styles.file, options.styles.folder);
    return getTemplateFile(inputFilename, outputFilename);
  }

  function prepareScripts() {
    var scriptsLang = options.scripts.type;
    var inputFilename = fileMap.scripts[scriptsLang]();
    var outputFilename = fileMap.scripts[scriptsLang](options.scripts.file, options.scripts.folder);
    return getTemplateFile(inputFilename, outputFilename);
  }

  options = deepAssign({}, defaults, options);

  var files = [];
  files.push(prepareHtml());
  files.push(prepareStyles());
  files.push(prepareScripts());
  if (options.scripts.type === 'babel') {
    files.push(getFile(babelRCPath, '.babelrc'));
  }
  if (options.babelPolyfill) {
    files.push(getFile(babelPolyfillPath, join(options.scripts.folder, 'polyfill.js')));
  }
  if (options.normalizeCss) {
    files.push(getFile(normalizeCssPath, join(options.styles.folder, 'normalize.css')));
  }

  return Promise.all(files);
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
 *      whitespaceFormatting: 'tabs', // Pass in a number (e.g. 2) to use spaces for whitespace, otherwise tabs will be used
 *    }
 *
 * @return {Promise<Array[string]>}            Files created during scaffolding
 */
module.exports = function barnyard(projectDir, options) {
  function outputFile(path, data) {
    return mkdirp(getDirName(path)).then(() => writeFile(path, data).then(() => path));
  }

  function outputFiles(files) {
    // TODO: reject promise when `join` fails
    var outputFilesList = files.map((file) => {
      var filePath = join(projectDir, file.path);
      return outputFile(filePath, file.data);
    });
    return Promise.all(outputFilesList);
  }

  return prepareFiles(options).then(outputFiles);
};

module.exports.preflight = function (filePath, options) {
  return checkdir(filePath, { ignoreDotFiles: true }).then((dirInfo) => {
    if (!dirInfo.exists || typeof options !== 'object') return dirInfo;
    return prepareFiles(options).then(prepared =>
      Object.assign(dirInfo, {
        preparedFiles: prepared.map(info => info.path),
      })
    );
  });
};
