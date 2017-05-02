'use strict';

const expect = require('unexpected').clone();
const spawn = require('child-process-promise').spawn;
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const rimraf = require('rimraf');

describe('cli', function cli() {
  const fixturesPath = path.join(__dirname, 'fixtures');
  const pingyJsonPath = path.join(fixturesPath, '.pingy.json');
  this.timeout(10000);

  it('should display help text when called with no args', () => {
    const promise = spawn('node', ['cli.js'], { capture: ['stdout', 'stderr'] });
    return promise.then((data) => {
      const output = data.stdout.toString();
      return expect.promise.all({
        commands: expect(output, 'to contain', 'Commands:'),
        dev: expect(output, 'to contain', 'dev'),
        export: expect(output, 'to contain', 'export'),
        init: expect(output, 'to contain', 'init'),
      });
    });
  });

  it('should create .pingy.json and scaffold using init command', () => {
    before(() => fs.unlinkSync(pingyJsonPath));

    const promise = spawn('node', ['../../cli.js', 'init'], {
      cwd: './test/fixtures',
    });
    const { stdout, stdin } = promise.childProcess;

    const nextStep = (matchString, write = '\n') =>
      new Promise((resolve) => {
        const onData = (data) => {
          if (data.toString().includes(matchString)) {
            stdout.removeListener('data', onData);
            resolve();
            stdin.write(write);
          }
        };
        stdout.on('data', onData);
      });

    nextStep('\n', '? ')
      .then(() => nextStep('? What document'))
      .then(() => nextStep('? What styles'))
      .then(() => nextStep('? What scripts'))
      .then(() => nextStep('? Choose the folder name to export'))
      .then(() => nextStep('? Do you want Pingy to scaffold', 'y\n'))
      .then(() => nextStep('? The most important question'))
      .then(() => nextStep('? Run this', 'n\n'));

    return promise.then(() => {
      const exists = file => expect(fs.existsSync(file), 'to be true');
      const indexHtml = path.join(fixturesPath, 'index.html');
      const scripts = path.join(fixturesPath, 'scripts', 'main.js');
      const styles = path.join(fixturesPath, 'styles', 'main.css');

      return expect.promise.all({
        dir: exists(pingyJsonPath),
        indexHtml: exists(indexHtml),
        scripts: exists(scripts),
        styles: exists(styles),
      });
    });
  });

  it('should serve site', () => {
    const promise = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
      cwd: './test/fixtures',
    });
    const { stdout } = promise.childProcess;

    const isServingSite = () =>
      new Promise((resolve) => {
        stdout.on('data', (data) => {
          const str = data.toString();
          const index = str.indexOf('http://');
          if (index !== -1) resolve(str.substring(index));
        });
      });

    return isServingSite()
      .then(url => fetch(url))
      .then(res => res.text())
      .then(body => expect(body, 'to contain', '/instant/client/bundle.js'));
  });

  it('should export site', () => {
    const distDir = path.join(__dirname, 'fixtures', 'dist');
    const scriptsDir = path.join(__dirname, 'fixtures', 'scripts');
    const stylesDir = path.join(__dirname, 'fixtures', 'styles');
    const indexPath = path.join(__dirname, 'fixtures', 'index.html');
    const shas = path.join(distDir, '.shas.json');

    after((done) => {
      fs.unlinkSync(pingyJsonPath);
      fs.unlinkSync(indexPath);
      rimraf(distDir, () => rimraf(scriptsDir, () => rimraf(stylesDir, done)));
    });

    const promise = spawn('node', ['../../cli.js', 'export'], {
      cwd: './test/fixtures',
    });

    const hasExportedSite = () =>
      new Promise((resolve) => {
        promise.childProcess.on('exit', resolve);
      });

    return hasExportedSite().then(() =>
      expect.promise.all({
        dir: expect(fs.existsSync(distDir), 'to be true'),
        shas: expect(fs.existsSync(shas), 'to be true'),
      })
    );
  });
});
