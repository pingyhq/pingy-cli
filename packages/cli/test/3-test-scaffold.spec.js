'use strict';

const expect = require('unexpected').clone();
const spawn = require('cross-spawn');
const path = require('upath');
const rimraf = require('rimraf');
const unexpectedWebdriver = require('unexpected-webdriver');
const mkdirp = require('mkdirp');
require('./assertions')(expect);

expect.use(unexpectedWebdriver());

const projectPath = path.join(__dirname, 'scaffolded-project');

function clearDir(done) {
  this.timeout(20000);
  rimraf(projectPath, err => done(err));
}
function clearAndCreateDir(done) {
  this.timeout(10000);
  rimraf(projectPath, () => mkdirp(projectPath, done));
}
before(clearAndCreateDir);
after(clearDir);

describe('cli scaffold', function cli() {
  const pingyJsonPath = path.join(projectPath, 'pingy.json');
  const pingyScaffoldJsonPath = path.join(projectPath, 'pingy-scaffold.json');
  const pkgJsonPath = path.join(projectPath, 'package.json');
  const indexHtml = path.join(projectPath, 'index.html');
  const scripts = path.join(projectPath, 'scripts', 'main.js');
  const styles = path.join(projectPath, 'styles', 'main.scss');
  const modules = path.join(projectPath, 'node_modules');

  this.timeout(100000);

  describe('shorthand github scaffold', () => {
    let spawnedInit;
    let stdin;
    let stdout;
    const nextStep = (matchString, write = '\n') =>
      new Promise(resolve => {
        const onData = data => {
          if (data.toString().includes(matchString)) {
            stdout.removeAllListeners('data');
            resolve();
            stdin.write(write);
          }
        };
        stdout.on('data', onData);
      });

    it('should spawn scaffold command', () => {
      spawnedInit = spawn(
        'node',
        [
          '../../cli.js',
          'scaffold',
          'pingyhq/pingy-scaffold-bootstrap-jumbotron',
          '--global-pingy'
        ],
        {
          cwd: projectPath,
        }
      );
      stdout = spawnedInit.stdout;
      stdin = spawnedInit.stdin;
    });

    it('should choose to scaffold files', () =>
      nextStep('? You are about to scaffold', 'y\n'));

    it('with 2 spaces', () => nextStep('? The most important question'));

    it('and install modules', () => nextStep('Run npm install ', '\n'));

    it('and wait for finish', done => {
      spawnedInit.stderr.on('data', data => {
        if (data.toString().includes('Installed')) {
          spawnedInit.stderr.removeAllListeners('data');
          spawnedInit.kill();
          done();
        }
      });
    });

    it('should have pingy.json', () => {
      expect(pingyJsonPath, 'to exist');
      expect(
        pingyJsonPath,
        'to have file content',
        '"path": "!node_modules/{bootstrap,bootstrap/dist,bootstrap/dist/**}"'
      );
    });

    it('should not have pingy-scaffold.json', () => {
      expect(pingyScaffoldJsonPath, 'not to exist');
    });

    it('should have package.json', () => {
      expect(pkgJsonPath, 'to exist');
    });

    it('should have website docs', () => {
      expect(indexHtml, 'to exist');
      expect(scripts, 'to exist');
      expect(styles, 'to exist');
    });

    it('should have node_modules', () => {
      expect(modules, 'to exist');
    });
  });

  describe('longhand github scaffold without scaffolding files or npm install', () => {
    let spawnedInit;
    let stdin;
    let stdout;
    const nextStep = (matchString, write = '\n') =>
      new Promise(resolve => {
        const onData = data => {
          if (data.toString().includes(matchString)) {
            stdout.removeAllListeners('data');
            resolve();
            stdin.write(write);
          }
        };
        stdout.on('data', onData);
      });

    before(clearAndCreateDir);

    it('should spawn scaffold command', () => {
      spawnedInit = spawn(
        'node',
        [
          '../../cli.js',
          'scaffold',
          'https://github.com/pingyhq/pingy-scaffold-bootstrap-jumbotron.git',
          '--global-pingy'
        ],
        {
          cwd: projectPath,
        }
      );
      stdout = spawnedInit.stdout;
      stdin = spawnedInit.stdin;
    });

    it('should choose not to scaffold files', () =>
      nextStep('? You are about to scaffold', '\u001B\u005B\u0042\n'));

    it('and not install modules', () => nextStep('Run npm install ', 'n\n'));

    it('and wait for finish', done => {
      spawnedInit.on('exit', done);
    });

    it('should have pingy.json', () => {
      expect(pingyJsonPath, 'to exist');
      expect(
        pingyJsonPath,
        'to have file content',
        '"path": "!node_modules/{bootstrap,bootstrap/dist,bootstrap/dist/**}"'
      );
    });

    it('should not have pingy-scaffold.json', () => {
      expect(pingyScaffoldJsonPath, 'not to exist');
    });

    it('should have package.json', () => {
      expect(pkgJsonPath, 'to exist');
    });

    it('should not have website docs', () => {
      expect(indexHtml, 'not to exist');
      expect(scripts, 'not to exist');
      expect(styles, 'not to exist');
    });

    it('should have node_modules', () => {
      expect(modules, 'not to exist');
    });
  });

  describe('alias scaffold', () => {
    let spawnedInit;
    let stdin;
    let stdout;
    const nextStep = (matchString, write = '\n') =>
      new Promise(resolve => {
        const onData = data => {
          if (data.toString().includes(matchString)) {
            stdout.removeAllListeners('data');
            resolve();
            stdin.write(write);
          }
        };
        stdout.on('data', onData);
      });

    before(clearAndCreateDir);

    it('should spawn scaffold command', () => {
      spawnedInit = spawn(
        'node',
        ['../../cli.js', 'scaffold', 'bootstrap-jumbotron', '--global-pingy'],
        {
          cwd: projectPath,
        }
      );
      stdout = spawnedInit.stdout;
      stdin = spawnedInit.stdin;
    });

    it('should choose to scaffold files', () =>
      nextStep('? You are about to scaffold', 'y\n'));

    it('with 2 spaces', () => nextStep('? The most important question'));

    it('and install modules', () => nextStep('Run npm install ', '\n'));

    it('and wait for finish', done => {
      spawnedInit.stderr.on('data', data => {
        if (data.toString().includes('Installed')) {
          spawnedInit.stderr.removeAllListeners('data');
          spawnedInit.kill();
          done();
        }
      });
    });

    it('should have pingy.json', () => {
      expect(pingyJsonPath, 'to exist');
      expect(
        pingyJsonPath,
        'to have file content',
        '"path": "!node_modules/{bootstrap,bootstrap/dist,bootstrap/dist/**}"'
      );
    });

    it('should not have pingy-scaffold.json', () => {
      expect(pingyScaffoldJsonPath, 'not to exist');
    });

    it('should have package.json', () => {
      expect(pkgJsonPath, 'to exist');
    });

    it('should have website docs', () => {
      expect(indexHtml, 'to exist');
      expect(scripts, 'to exist');
      expect(styles, 'to exist');
    });

    it('should have node_modules', () => {
      expect(modules, 'to exist');
    });
  });
});
