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
  const indexHtml = path.join(fixturesPath, 'index.html');
  const scripts = path.join(fixturesPath, 'scripts', 'main.js');
  const styles = path.join(fixturesPath, 'styles', 'main.css');
  let siteUrl;
  let stylesUrl;
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

  it('`init` should create .pingy.json and scaffold using init command', () => {
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

      return expect.promise.all({
        dir: exists(pingyJsonPath),
        indexHtml: exists(indexHtml),
        scripts: exists(scripts),
        styles: exists(styles),
      });
    });
  });

  const isServingSite = stdout =>
    new Promise((resolve) => {
      stdout.on('data', (data) => {
        const str = data.toString();
        const index = str.indexOf('http://');
        if (index !== -1) resolve(str.substring(index));
      });
    });

  it('`dev` should serve site', () => {
    const promise = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
      cwd: './test/fixtures',
    });
    const { stdout } = promise.childProcess;

    return isServingSite(stdout)
      .then((url) => {
        siteUrl = url.split('\n')[0];
        stylesUrl = `${siteUrl}/styles/main.css`;
        return fetch(siteUrl);
      })
      .then(res => res.text())
      .then(body => expect(body, 'to contain', '/instant/client/bundle.js'))
      .then(() => fetch(stylesUrl))
      .then(res => res.text())
      .then(body => expect(body, 'to contain', 'color: hotpink;'))
      .then(() => {
        // Making a change
        const s = fs.readFileSync(styles, 'utf8');
        fs.writeFileSync(styles, `${s}\nbody { display: flex }`);
      })
      .then(() => fetch(stylesUrl))
      .then(res => res.text())
      .then(body => expect(body, 'to contain', 'body { display: flex }'));
  });

  const distDir = path.join(__dirname, 'fixtures', 'dist');
  const scriptsDir = path.join(__dirname, 'fixtures', 'scripts');
  const stylesDir = path.join(__dirname, 'fixtures', 'styles');
  const indexPath = path.join(__dirname, 'fixtures', 'index.html');
  const shas = path.join(distDir, '.shas.json');
  const distIndexPath = path.join(distDir, 'index.html');

  describe('export', () => {
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

  it('`export` should respect .pingy.json (autoprefix)', () => {
    after((done) => {
      fs.unlinkSync(pingyJsonPath);
      fs.unlinkSync(indexPath);
      rimraf(distDir, () => rimraf(scriptsDir, () => rimraf(stylesDir, done)));
    });

    it('should export site', () => {
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
          index: expect(fs.readFileSync(distIndexPath, 'utf8'), 'to contain', '<body><h1>Hello'),
        })
      );
    });

    it('should export site (unminified)', () => {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": true,', '"minify": false,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      const promise = spawn('node', ['../../cli.js', 'export'], {
        cwd: './test/fixtures',
      });

      const addAutoprefixConfig = () => {
        const p = fs.readFileSync(pingyJsonPath, 'utf8');
        fs.writeFileSync(
          pingyJsonPath,
          p.replace('"minify": true,', '"minify": true,\n\t"autoprefix": true,')
        );
      };

      addAutoprefixConfig();
      return hasExportedSite().then(() =>
        expect.promise.all({
          dir: expect(fs.existsSync(distDir), 'to be true'),
          shas: expect(fs.existsSync(shas), 'to be true'),
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display:-webkit-box'
          ),
        })
      );
    });
  });
});
