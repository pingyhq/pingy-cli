const expect = require('unexpected').clone();
const spawn = require('child-process-promise').spawn;
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const rimraf = require('rimraf');

describe('cli', function() {
  const pingyJsonPath = path.join(__dirname, 'fixtures', '.pingy.json')
  this.timeout(10000);

  it('should display help text when called with no args', () => {
    const promise = spawn('node', ['cli.js'], { capture: [ 'stdout', 'stderr' ]});
    return promise.then((data) => {
      const output = data.stdout.toString();
      return expect.promise.all({
        commands: expect(output, 'to contain', 'Commands:'),
        serve: expect(output, 'to contain', 'serve'),
        export: expect(output, 'to contain', 'export'),
        init: expect(output, 'to contain', 'init'),
      });
    });
  });

  it('should create .pingy.json using init command', () => {
    before(() => fs.unlinkSync(pingyJsonPath));

    const promise = spawn('node', ['../../cli.js', 'init'], {
      cwd: './test/fixtures'
    });
    const { stdout, stdin } = promise.childProcess;

    const nextStep = (write = '\n', count = 0) => new Promise(resolve => {
      stdin.write(write);
      stdout.on('data', data => {
        if (data.toString().startsWith('? ')) {
          count += 1;
          if (count === 2) resolve();
        }
      });
    });

    nextStep('\n', 1).then(() =>
      // Choose HTML
      nextStep()
    ).then(() =>
      // Choose CSS
      nextStep()
    )
    .then(() =>
      // Choose JS
      nextStep()
    )
    .then(() =>
      // Choose 'dist' folder name
      nextStep()
    )
    .then(() =>
      // don't install deps
      nextStep('n\n')
    )

    return promise.then(() =>
      expect(fs.existsSync(pingyJsonPath), 'to be true')
    );
  });

  it('should serve site', () => {
    const promise = spawn('node', ['../../cli.js', 'serve'], {
      cwd: './test/fixtures'
    });
    const { stdout } = promise.childProcess;

    const isServingSite = () => new Promise(resolve => {
      stdout.on('data', data => {
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
    const shas = path.join(distDir, '.shas.json')

    after(done => {
      fs.unlinkSync(pingyJsonPath);
      rimraf(distDir, done);
    });

    const promise = spawn('node', ['../../cli.js', 'export'], {
      cwd: './test/fixtures',
    });
    const { stdout } = promise.childProcess;

    const hasExportedSite = () => new Promise(resolve => {
      promise.childProcess.on('exit', resolve);
    });

    return hasExportedSite().then(() => {
      return expect.promise.all({
        dir: expect(fs.existsSync(distDir), 'to be true'),
        shas: expect(fs.existsSync(shas), 'to be true'),
      });
    });
  });

});
