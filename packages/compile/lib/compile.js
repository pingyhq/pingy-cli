'use strict';

const Path = require('upath');
const when = require('when');
const fs = require('fs-extra');
const accord = require('@pingy/accord');
const pathCompleteExtname = require('path-complete-extname');
const crypto = require('crypto');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
const minify = require('./minify');

let extensionMap;
let loadedAdapters;
let targetExtension;
let sourceExtension;

// Whitelisted adapters
const adapters = [
  'LiveScript',
  'babel',
  'buble',
  'coco',
  'coffee-script',
  'dogescript',
  'ejs',
  'less',
  'markdown',
  'myth',
  'pug',
  'scss',
  'stylus',
  'swig',
  'typescript',
  'jade'
];

function load() {
  extensionMap = {};
  loadedAdapters = [];
  Object.keys(accord.all())
    .map(engine => {
      if (adapters.indexOf(engine) === -1) {
        return undefined;
      }

      try {
        return accord.load(
          engine,
          global ? global.pingyCompilerModulePath : null
        );
      } catch (e) {
        if (
          e.code !== 'MODULE_NOT_FOUND' &&
          e.message.indexOf('Cannot find module') === -1
        ) {
          console.error(
            `${e.message.replace(
              /^error: ?/i,
              'Accord Error: '
            )}. Try updating to the latest version`
          );
        }
        // else {
        //   console.error('Missing adapter:', engine);
        // }
      }
    })
    .filter(engine => engine)
    .forEach(adapter => {
      if (
        adapter.engineName === 'babel' ||
        adapter.engineName === 'babel-core'
      ) {
        // Monkey-patching Babel adapter so that it doesn't try and compile all .js files
        adapter.extensions = ['babel.js'];
      }
      if (adapter.engineName === 'buble') {
        // Monkey-patching Bublé adapter so that it doesn't try and compile all .js files
        adapter.extensions = ['buble.js'];
      }
      loadedAdapters.push(adapter);
      const extensions = adapter.extensions.map(extension => `.${extension}`);
      extensions.forEach(extension => {
        if (!Array.isArray(extensionMap[extension])) {
          extensionMap[extension] = [];
        }

        extensionMap[extension].push(adapter);
      });
    });

  targetExtension = {};
  sourceExtension = {};

  Object.keys(extensionMap).forEach(sourceExt => {
    const adapters = extensionMap[sourceExt];
    const targetExt = `.${adapters[0].output}`;

    targetExtension[sourceExt] = targetExt;

    if (!sourceExtension[targetExt]) {
      sourceExtension[targetExt] = [];
    }

    sourceExtension[targetExt].push(sourceExt);
  });
}
load();

function replaceExt(npath, ext) {
  if (typeof npath !== 'string') {
    return npath;
  }

  if (npath.length === 0) {
    return npath;
  }

  const nFileName = Path.basename(npath, pathCompleteExtname(npath)) + ext;
  return Path.join(Path.dirname(npath), nFileName);
}

const dontCompile = function(pathName) {
  // Baby Tolk wont compile files that begin with an underscore `_`.
  // This is by convention.
  const baseName = Path.basename(pathName);
  return baseName[0] === '_';
};

const createHash = function(data) {
  const shasum = crypto.createHash('sha1');
  shasum.update(data);
  return shasum.digest('hex');
};

const sanitizeOptions = function(options) {
  options = options || {};
  options.sourceMap = options.sourceMap !== false;
  if (options.sha) {
    options.inputSha = true;
    options.outputSha = true;
  }
  if (options.autoprefix) {
    if (typeof options.autoprefix === 'string') {
      options.autoprefix = [options.autoprefix];
    } else if (options.autoprefix === true) {
      options.autoprefix = ['last 2 versions'];
    }
  }
  return options;
};

const getAdapter = function(extension) {
  const adapters = extensionMap[extension];
  return adapters && adapters[0];
};

const _getTransformId = function(adapter, options, extension) {
  let transformId = '';
  if (adapter) {
    transformId = `${adapter.engineName}@${adapter.engine.version}`;
  }

  if (options.autoprefix) {
    if (
      extension === '.css' ||
      (adapter && targetExtension[extension] === '.css')
    ) {
      transformId += `::autoprefix=${options.autoprefix}`;
    }
  }
  if (options.sourceMap) {
    transformId += '::map';
  }
  if (options.minify) {
    transformId += '::minify';
  }
  return transformId;
};

const getTransformId = function(pathName, options) {
  options = sanitizeOptions(options);
  const extension = pathCompleteExtname(pathName);
  const adapter = !dontCompile(pathName) && getAdapter(extension);
  return _getTransformId(adapter, options, extension);
};

function canCompile(pathName) {
  const extension = pathCompleteExtname(pathName);
  return !dontCompile(pathName) && !!targetExtension[extension];
}

/**
 * Lists all paths to potential source files
 * @param  {string} compiledFile
 * @return {Array}               paths to potential source files
 */
function listPotentialSourceFiles(compiledFile) {
  const compiledExtension = Path.extname(compiledFile);
  const targetExtensions = sourceExtension[compiledExtension] || [];

  return targetExtensions.map(extension =>
    compiledFile.replace(compiledExtension, extension)
  );
}

function findTargetFile(compiledFilePath) {
  const srcExt = pathCompleteExtname(compiledFilePath);
  const compiledExt = targetExtension[srcExt];
  if (!compiledExt) return compiledFilePath;
  return replaceExt(compiledFilePath, compiledExt);
}

/**
 * Find the corresponding source file when given the path to the compiled file
 * @param  {string}                compiledFile path
 * @return {Promise<string, null>}              path to source file or reject with null
 */
function findSourceFile(compiledFile) {
  const dir = Path.dirname(compiledFile);
  const potentialSourceFiles = listPotentialSourceFiles(compiledFile);
  if (!potentialSourceFiles.length) {
    // Exit early instead of doing pointless IO
    return Promise.resolve(null);
  }

  return fs.readdir(dir).then(files => {
    // Find the first source file match in dir
    const sourceFile = files
      .map(file =>
        // Give files their full path
        Path.join(dir, file)
      )
      .find(file =>
        potentialSourceFiles.find(potentialSource => potentialSource === file)
      );
    return sourceFile || null;
  }, () => null);
}

module.exports = {
  get extensions() {
    return extensionMap;
  },
  get sourceExtensionMap() {
    return sourceExtension;
  },
  get targetExtensionMap() {
    return targetExtension;
  },
  canCompile,
  listPotentialSourceFiles,
  findTargetFile,
  findSourceFile,
  reload: load,
  adapters: loadedAdapters,
  isMinifiable: minify.isMinifiable,
  getTransformId,
  read(pathName, options) {
    pathName = Path.normalize(pathName);
    options = sanitizeOptions(options);

    const extension = pathCompleteExtname(pathName);
    const adapter = !dontCompile(pathName) && getAdapter(extension);
    let isCss = Path.extname(pathName) === '.css';

    const sourceFile = fs.readFile(pathName, 'utf8');
    let sourceFileContents = null;

    let continuation = sourceFile.then(result => {
      const obj = { result };
      sourceFileContents = result;
      // if (options.inputSha) { obj.inputSha = createHash(result); }
      return obj;
    });

    const transformId = _getTransformId(adapter, options, extension);
    if (adapter) {
      isCss = adapter.output === 'css';
      const transpilerOptions = Object.assign({}, options, {
        sourcemap: options.sourceMap,
        filename: pathName,
      });

      if (adapter.engineName === 'node-sass') {
        transpilerOptions.includePaths = [Path.dirname(pathName)];
        if (extension === '.sass') transpilerOptions.indentedSyntax = true;
      }

      const manuallyTrackedSourceFiles = [];
      if (adapter.engineName === 'ejs') {
        adapter.engine.fileLoader = filePath => {
          manuallyTrackedSourceFiles.push(filePath);
          return fs.readFileSync(filePath);
        };
      }

      continuation = continuation.then(source =>
        adapter.render(source.result, transpilerOptions).then(compiled => {
          compiled.manuallyTrackedSourceFiles =
            compiled.dependencies || manuallyTrackedSourceFiles;
          compiled.extension = `.${adapter.output}`;
          compiled.inputPath = pathName;
          if (options.inputSha) {
            compiled.inputSha = source.inputSha;
          }
          return compiled;
        })
      );
    } else {
      continuation = continuation.then(source => {
        source.extension = extension;
        source.inputPath = pathName;
        return source;
      });
    }

    if (isCss && options.autoprefix) {
      continuation = continuation.then(compiled => {
        const postCssOptions = {};
        if (compiled.sourcemap) {
          postCssOptions.map = {
            prev: compiled.sourcemap,
          };
        }
        return postcss([autoprefixer({ browsers: options.autoprefix })])
          .process(compiled.result, postCssOptions)
          .then(result => {
            compiled.result = result.css;
            if (result.map) {
              compiled.sourcemap = result.map;
            }
            return compiled;
          });
      });
    }

    continuation = continuation.then(compiled => {
      if (options.minify) {
        compiled = minify(compiled, options);
      }

      if (compiled.sourcemap) {
        if (
          compiled.sourcemap.constructor &&
          compiled.sourcemap.constructor.name === 'SourceMapGenerator'
        ) {
          compiled.sourcemap = compiled.sourcemap.toJSON();
        }
        compiled.sourcemap.sources = compiled.sourcemap.sources
          // FIX: https://github.com/pingyhq/pingy-cli/issues/15
          .filter(x => x !== '$stdin')
          .map(x => Path.normalize(x === '$stdin' ? compiled.inputPath : x));
      }

      if (options.outputSha) {
        compiled.outputSha = createHash(compiled.result);
      }
      compiled.transformId = transformId === '' ? null : transformId;
      if (options.inputSha) {
        let inputSha = [
          {
            file: pathName,
            sha: createHash(sourceFileContents),
          }
        ];
        let shaSources;
        if (compiled.sourcemap) {
          shaSources = compiled.sourcemap.sources;
        } else if (compiled.manuallyTrackedSourceFiles) {
          shaSources = compiled.manuallyTrackedSourceFiles;
        }
        if (compiled.sourcemap || compiled.manuallyTrackedSourceFiles) {
          inputSha = inputSha.concat(
            shaSources.map(path => {
              if (Path.normalize(path) === pathName) {
                return null;
              }
              return fs.readFile(path, 'utf8').then(
                content => ({
                  file: path,
                  sha: createHash(content),
                }),
                () => null
              );
            })
          );
        }
        return when.all(inputSha).then(shas => {
          compiled.inputSha = shas.filter(x => Boolean(x));
          return compiled;
        });
      }
      return compiled;
    });

    return continuation;
  },
};
