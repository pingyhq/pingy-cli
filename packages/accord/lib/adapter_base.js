const W            = require('when');
let clone        = require('lodash.clone');
let partialRight = require('lodash.partialright');
let resolve      = require('resolve');
let path         = require('path');
let fs           = require('fs');
let readFile     = require('when/node/function').lift(fs.readFile); 

class Adapter {
  static initClass() {
    /**
     * The names of the npm modules that are supported to be used as engines by
       the adapter. Defaults to the name of the adapter.
     * @type {String[]}
    */
    this.prototype.supportedEngines = undefined;
  
    /**
     * The name of the engine in-use. Generally this is the name of the package on
       npm.
     * @type {String}
    */
    this.prototype.engineName = '';
  
    /**
     * The actual engine, no adapter wrapper. Defaults to the engine that we
       recommend for compiling that particular language (if it is installed).
       Otherwise, whatever engine we support that is installed.
    */
    this.prototype.engine = undefined;
  
    /**
     * Array of all file extensions the compiler should match
     * @type {String[]}
    */
    this.prototype.extensions = undefined;
  
    /**
     * Expected output extension
     * @type {String}
    */
    this.prototype.output = '';
  
    /**
     * Specify if the output of the language is independent of other files or the
       evaluation of potentially stateful functions. This means that the only
       information passed into the engine is what gets passed to Accord's
       compile/render function, and whenever that same input is given, the output
       will always be the same.
     * @type {Boolean}
     * @todo Add detection for when a particular job qualifies as isolated
    */
    this.prototype.isolated = false;
  
    /**
     * Some adapters that compile for client also need helpers, this method
       returns a string of minfied JavaScript with all of them
     * @return {Promise} A promise for the client-side helpers.
    */
    this.prototype.clientHelpers = undefined;
  }

  /**
   * @param {String} [engine=Adapter.supportedEngines[0]] If you need to use a
     particular engine to compile/render with, then specify it here. Otherwise
     we use whatever engine you have installed.
  */
  constructor(engineName, customPath) {
    this.engineName = engineName;
    if (!this.supportedEngines || (this.supportedEngines.length === 0)) {
      this.supportedEngines = [this.name];
    }
    if (this.engineName != null) {
      // a specific engine is required by user
      if (!Array.from(this.supportedEngines).includes(this.engineName)) {
        throw new Error(`engine '${this.engineName}' not supported`);
      }
      this.engine = requireEngine(this.engineName, customPath);
    } else {
      for (this.engineName of Array.from(this.supportedEngines)) {
        try {
          this.engine = requireEngine(this.engineName, customPath);
        } catch (error) {
          continue; // try the next one
        }
        return;
      } // it worked, we're done
      // nothing in the loop worked, throw an error
      throw new Error(`\
'tried to require: ${this.supportedEngines}'.
None found. Make sure one has been installed!\
`);
    }
  }

  /**
   * Render a string to a compiled string
   * @param {String} str
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  render(str, opts) {
    if (opts == null) { opts = {}; }
    if (!this._render) { return W.reject(new Error('render not supported')); }
    return this._render(str, opts);
  }

  /**
   * Render a file to a compiled string
   * @param {String} file The path to the file
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  renderFile(file, opts) {
    if (opts == null) { opts = {}; }
    opts = clone(opts, true);
    return readFile(file, 'utf8')
      .then(partialRight(this.render, Object.assign({ filename: file }, opts)).bind(this));
  }

  /**
   * Compile a string to a function
   * @param {String} str
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  compile(str, opts) {
    if (opts == null) { opts = {}; }
    if (!this._compile) { return W.reject(new Error('compile not supported')); }
    return this._compile(str, opts);
  }

  /**
   * Compile a file to a function
   * @param {String} file The path to the file
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  compileFile(file, opts) {
    if (opts == null) { opts = {}; }
    return readFile(file, 'utf8')
      .then(partialRight(this.compile, Object.assign({ filename: file }, opts)).bind(this));
  }

  /**
   * Compile a string to a client-side-ready function
   * @param {String} str
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  compileClient(str, opts) {
    if (opts == null) { opts = {}; }
    if (!this._compileClient) {
      return W.reject(new Error('client-side compile not supported'));
    }
    return this._compileClient(str, opts);
  }

  /**
   * Compile a file to a client-side-ready function
   * @param {String} file The path to the file
   * @param {Object} [opts = {}]
   * @return {Promise}
  */
  compileFileClient(file, opts) {
    if (opts == null) { opts = {}; }
    return readFile(file, 'utf8')
      .then(partialRight(this.compileClient, Object.assign(opts, {filename: file})).bind(this));
  }
}
Adapter.initClass();


var requireEngine = function(engineName, customPath) {
  let engine, err;
  if (customPath != null) {
    engine = require(resolve.sync(path.basename(customPath), {basedir: customPath}));
    engine.__accord_path = customPath;
  } else {
    try {
      engine = require(engineName);
      engine.__accord_path = resolvePath(engineName);
    } catch (error) {
      err = error;
      throw new Error(`'${engineName}' not found. make sure it has been installed!`);
    }
  }

  try {
    if (!engine.version) {
      engine.version = require(engine.__accord_path + '/package.json').version;
    }
  } catch (error1) { err = error1; }

  return engine;
};


/**
 * Get the path to the root folder of a node module, given its name.
 * @param  {String} name The name of the node module you want the path to.
 * @return {String} The root folder of node module `name`.
 * @private
*/
var resolvePath = function(name) {
  let filepath = require.resolve(name);
  while (true) {
    if (filepath === '/') {
      throw new Error(`cannot resolve root of node module ${name}`);
    }
    filepath = path.dirname(filepath); // cut off the last part of the path
    if (fs.existsSync(path.join(filepath, 'package.json'))) {
      // if there's a package.json directly under it, we've found the root of the
      // module
      return filepath;
    }
  }
};

module.exports = Adapter;
