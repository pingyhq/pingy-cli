'use strict';

const expect = require('unexpected').clone();
const spawn = require('child-process-promise').spawn;
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const rimraf = require('rimraf');
const webdriver = require('friendly-webdriver');
const unexpectedWebdriver = require('unexpected-webdriver');
const unexpected = require('unexpected');
const mkdirp = require('mkdirp');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const appendToFile = (file, contents) => {
  const oldContents = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, `${oldContents}\n${contents}`);
};
const replaceInFile = (file, oldString, newString) => {
  const oldContents = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, oldContents.replace(oldString, newString));
};

expect.use(unexpectedWebdriver());

let wd;
const projectPath = path.join(__dirname, 'simple-project');

after(function (done) {
  this.timeout(20000);
  rimraf(projectPath, () => {
    if (wd) return wd.quit().then(done);
    done();
  });
});
before(function (done) {
  this.timeout(20000);
  rimraf(projectPath, () => mkdirp(projectPath, done));
});

describe('cli simple', function cli() {
  const pingyJsonPath = path.join(projectPath, '.pingy.json');
  const indexHtml = path.join(projectPath, 'index.html');
  const scripts = path.join(projectPath, 'scripts', 'main.js');
  const styles = path.join(projectPath, 'styles', 'main.css');
  let siteUrl;
  let stylesUrl;
  this.timeout(100000);

  function addAutoprefixConfig() {
    const p = fs.readFileSync(pingyJsonPath, 'utf8');
    fs.writeFileSync(
      pingyJsonPath,
      p.replace('"minify": true,', '"minify": true,\n\t"autoprefix": true,')
    );
  }

  function changeAutoprefixConfig() {
    const p = fs.readFileSync(pingyJsonPath, 'utf8');
    fs.writeFileSync(pingyJsonPath, p.replace('"autoprefix": true', '"autoprefix": "> 5%"'));
  }

  function changeBackAutoprefixConfig() {
    const p = fs.readFileSync(pingyJsonPath, 'utf8');
    fs.writeFileSync(pingyJsonPath, p.replace('"autoprefix": "> 5%"', '"autoprefix": true'));
  }

  it('should display help text when called with no args', function() {
    const spawned = spawn('node', ['cli.js'], { capture: ['stdout', 'stderr'] });
    return spawned.then((data) => {
      const output = data.stdout.toString();
      return expect.promise.all({
        commands: expect(output, 'to contain', 'Commands:'),
        dev: expect(output, 'to contain', 'dev'),
        export: expect(output, 'to contain', 'export'),
        init: expect(output, 'to contain', 'init'),
      });
    });
  });

  describe('init', function() {
    before(function() {
      try {
        fs.unlinkSync(pingyJsonPath);
        fs.unlinkSync(indexHtml);
        fs.unlinkSync(scripts);
        fs.unlinkSync(styles);
      } catch (e) {}
    });
    it('should create .pingy.json and scaffold using init command', function() {
      const spawned = spawn('node', ['../../cli.js', 'init'], {
        cwd: projectPath,
      });
      const { stdout, stdin } = spawned.childProcess;

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

      const exists = file => expect(fs.existsSync(file), 'to be true');
      return spawned.then(() =>
        expect.promise.all({
          dir: exists(pingyJsonPath),
          indexHtml: exists(indexHtml),
          scripts: exists(scripts),
          styles: exists(styles),
        })
      );
    });
  });

  describe('dev', function() {
    const helpers = {
      isServingSite(stdout) {
        return new Promise((resolve) => {
          stdout.on('data', (data) => {
            const str = data.toString();
            const index = str.indexOf('http://');
            if (index !== -1) resolve(str.substring(index).replace('\n', ''));
          });
        });
      },
      waitForCss(el, prop, val) {
        return delay(1000).then(() => expect(wd.find(el).css(prop), 'to be fulfilled with', val));
      },
    };

    it('should serve site', function() {
      const spawned = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
        cwd: projectPath,
      }).catch((err) => {});
      const { stdout } = spawned.childProcess;

      return helpers
        .isServingSite(stdout)
        .then((url) => {
          siteUrl = url.split('\n')[0];
          stylesUrl = `${siteUrl}/styles/main.css`;
          wd = webdriver({
            base: siteUrl,
            browser: 'chrome',
            capabilities: {
              chromeOptions: {
                args: ['headless', 'disable-gpu', 'window-size=1200x600'],
              },
            },
          });
          return wd;
        })
        .then(() => {
          wd.goto('/');
          return expect(wd.find('script'), 'to exist');
        })
        .then(() =>
          expect(
            wd.find('body').css('background-color'),
            'to be fulfilled with',
            'rgba(0, 0, 0, 0)'
          )
        )
        .then(() => appendToFile(styles, 'body { background: rgba(255, 255, 0, 1) }'))
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 255, 0, 1)'))
        .then(() =>
          replaceInFile(indexHtml, '<body>', '<body style="background: rgba(255, 0, 0, 1)">')
        )
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 0, 0, 1)'))
        .then(() =>
          appendToFile(scripts, "document.body.style.background = 'rgba(255, 255, 255, 1)';")
        )
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 255, 255, 1)'))
        .then(() => appendToFile(styles, 'body { display: flex }'))
        .then(() => fetch(stylesUrl).then(res => res.text()))
        .then(css =>
          expect(css, 'to contain', 'body { display: flex }').and('not to contain', '-ms-flexbox')
        )
        .then(() => appendToFile(styles, 'p { background: rgba(0, 255, 0, 1) }'))
        .then(() => helpers.waitForCss('p', 'background-color', 'rgba(0, 255, 0, 1)'))
        .then(
          () =>
            new Promise((resolve) => {
              spawned.childProcess.on('exit', resolve);
              spawned.childProcess.kill();
            })
        );
    });

    it('should serve autoprefixed site', function() {
      let siteUrl;
      addAutoprefixConfig();
      const spawned = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
        cwd: projectPath,
      }).catch((err) => {});
      const { stdout } = spawned.childProcess;
      return helpers
        .isServingSite(stdout)
        .then((url) => {
          siteUrl = url;
          stylesUrl = `${url}/styles/main.css`;
          return fetch(stylesUrl).then(res => res.text());
        })
        .then(css => expect(css, 'to contain', '-ms-flexbox'))
        .then(() => {
          wd.goto(siteUrl);
          return expect(wd.find('script'), 'to exist');
        })
        .then(() => appendToFile(styles, 'html { background: blue }'))
        .then(() => helpers.waitForCss('html', 'background-color', 'rgba(0, 0, 255, 1)'))
        .then(
          () =>
            new Promise((resolve) => {
              spawned.childProcess.on('exit', resolve);
              spawned.childProcess.kill();
            })
        );
    });

    it('should serve autoprefixed site with browsers > 5%', function() {
      let siteUrl;
      changeAutoprefixConfig();
      const spawned = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
        cwd: projectPath,
      }).catch((err) => {});
      const { stdout } = spawned.childProcess;
      return helpers
        .isServingSite(stdout)
        .then((url) => {
          siteUrl = url;
          stylesUrl = `${url}/styles/main.css`;
          return fetch(stylesUrl).then(res => res.text());
        })
        .then(css => expect(css, 'not to contain', '-ms-flexbox'))
        .then(() => {
          wd.goto(siteUrl);
          return expect(wd.find('script'), 'to exist');
        })
        .then(() => appendToFile(styles, 'html { background: yellow }'))
        .then(() => helpers.waitForCss('html', 'background-color', 'rgba(255, 255, 0, 1)'))
        .then(() => appendToFile(styles, 'html { background: blue }'))
        .then(() => helpers.waitForCss('html', 'background-color', 'rgba(0, 0, 255, 1)'))
        .then(
          () =>
            new Promise((resolve) => {
              spawned.childProcess.on('exit', resolve);
              spawned.childProcess.kill();
            })
        );
    });
  });

  describe('export', function() {
    const distDir = path.join(projectPath, 'dist');
    const scriptsDir = path.join(projectPath, 'scripts');
    const stylesDir = path.join(projectPath, 'styles');
    const indexPath = path.join(projectPath, 'index.html');
    const shas = path.join(distDir, '.shas.json');
    const distIndexPath = path.join(distDir, 'index.html');
    const stylesDistFile = path.join(distDir, 'styles', 'main.css');

    const hasExportedSite = spawned =>
      new Promise(resolve => spawned.childProcess.on('exit', resolve));

    after(function(done) {
      fs.unlinkSync(pingyJsonPath);
      fs.unlinkSync(indexPath);
      rimraf(distDir, () => rimraf(scriptsDir, () => rimraf(stylesDir, done)));
    });

    it('should export site (minified)', function() {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": false,', '"minify": true,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      const spawned = spawn('node', ['../../cli.js', 'export'], {
        cwd: projectPath,
      });

      return hasExportedSite(spawned).then(() =>
        expect.promise.all({
          dir: expect(fs.existsSync(distDir), 'to be true'),
          shas: expect(fs.existsSync(shas), 'to be true'),
          index: expect(fs.readFileSync(distIndexPath, 'utf8'), 'to contain', '<h1>Hello'),
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display:-webkit-box'
          ),
        })
      );
    });

    it('should export site (autoprefixed + minified)', function() {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": true,', '"minify": false,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      const spawned = spawn('node', ['../../cli.js', 'export'], {
        cwd: projectPath,
      });

      return hasExportedSite(spawned).then(() =>
        expect.promise.all({
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display: -webkit-box'
          ),
        })
      );
    });

    it('should export site (autoprefixed)', function() {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent
        .replace('"minify": true,', '"minify": false,')
        .replace('"autoprefix": "> 5%"', '"autoprefix": true');
      fs.writeFileSync(pingyJsonPath, newPingyContent);
      changeBackAutoprefixConfig();

      const spawned = spawn('node', ['../../cli.js', 'export'], {
        cwd: projectPath,
      });

      return hasExportedSite(spawned).then(() =>
        expect.promise.all({
          dir: expect(fs.existsSync(distDir), 'to be true'),
          shas: expect(fs.existsSync(shas), 'to be true'),
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display: -webkit-box; display: -ms-flexbox;'
          ),
        })
      );
    });

    it('should export site (autoprefixed + minified)', function() {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": false,', '"minify": true,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      const spawned = spawn('node', ['../../cli.js', 'export'], {
        cwd: projectPath,
      });

      return hasExportedSite(spawned).then(() =>
        expect.promise.all({
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display:-webkit-box'
          ),
        })
      );
    });

    it('should export site (after edit)', function() {
      const css = fs.readFileSync(styles, 'utf8');
      const newCss = `${css}\nh4 { display: flex }`;
      fs.writeFileSync(styles, newCss);

      const spawned = spawn('node', ['../../cli.js', 'export'], {
        cwd: projectPath,
      });

      return hasExportedSite(spawned).then(() =>
        expect.promise.all({
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'body,h4{display:-webkit-box;display:-ms-flexbox}'
          ),
        })
      );
    });
  });
});
