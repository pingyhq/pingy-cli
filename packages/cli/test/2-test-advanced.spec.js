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

const addFile = (filePath, newFilePath) => {
  fs.writeFileSync(newFilePath, fs.readFileSync(filePath, 'utf8'));
};

expect.use(unexpectedWebdriver());

let wd;
const projectPath = path.join(__dirname, 'advanced-project');
const fixturesPath = path.join(__dirname, 'fixtures');

after(function (done) {
  this.timeout(20000);
  rimraf(projectPath, () => {
    if (wd) return wd.quit().then(done);
    done();
  });
});
before(function (done) {
  this.timeout(10000);
  rimraf(projectPath, () => mkdirp(projectPath, done));
});

describe('cli advanced', function cli() {
  const pingyJsonPath = path.join(projectPath, '.pingy.json');
  const indexHtml = path.join(projectPath, 'index.pug');
  const scripts = path.join(projectPath, 'scripts', 'main.babel.js');
  const styles = path.join(projectPath, 'styles', 'main.scss');
  const modules = path.join(projectPath, 'node_modules');

  let siteUrl;
  let stylesUrl;
  let scriptsUrl;
  this.timeout(1000000);

  function addAutoprefixConfig() {
    const p = fs.readFileSync(pingyJsonPath, 'utf8');
    fs.writeFileSync(
      pingyJsonPath,
      p.replace('"minify": true,', '"minify": true,\n\t"autoprefix": true,')
    );
  }

  function changeBackAutoprefixConfig() {
    const p = fs.readFileSync(pingyJsonPath, 'utf8');
    fs.writeFileSync(pingyJsonPath, p.replace('"autoprefix": "> 5%"', '"autoprefix": true'));
  }

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
      return delay(2000).then(() => expect(wd.find(el).css(prop), 'to be fulfilled with', val));
    },
  };

  describe('init', function() {
    it('should create .pingy.json and scaffold using init command', function() {
      const spawnedInit = spawn('node', ['../../cli.js', 'init', '--global-pingy'], {
        cwd: projectPath,
      });
      const { stdout, stdin } = spawnedInit.childProcess;

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
        .then(() => nextStep('? What document', '\u001B\u005B\u0042\u001B\u005B\u0042\n'))
        .then(() => nextStep('? What styles', '\u001B\u005B\u0042\n'))
        .then(() => nextStep('? What scripts', '\u001B\u005B\u0042\u001B\u005B\u0042\n'))
        .then(() => nextStep('? Choose the folder name to export'))
        .then(() => nextStep('? Do you want Pingy to scaffold', 'y\n'))
        .then(() => nextStep('? The most important question'))
        .then(() => nextStep('? Run this', 'y\n'));

      const exists = file => expect(fs.existsSync(file), 'to be true');
      return spawnedInit.then(() =>
        expect.promise.all({
          dir: exists(pingyJsonPath),
          indexHtml: exists(indexHtml),
          scripts: exists(scripts),
          styles: exists(styles),
          modules: exists(modules),
        })
      );
    });
  });

  describe('dev', function() {
    let spawned;

    it('should serve site', function() {
      spawned = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
        cwd: projectPath,
      }).catch((err) => {});
      const { stdout } = spawned.childProcess;

      return helpers
        .isServingSite(stdout)
        .then((url) => {
          siteUrl = url.split('\n')[0];
          stylesUrl = `${siteUrl}/styles/main.css`;
          scriptsUrl = `${siteUrl}/scripts/main.js`;
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
        );
    });

    it('should work with live-reload', function() {
      return new Promise(resolve =>
        resolve(appendToFile(styles, 'body { background: rgba(255, 255, 0, 1) }'))
      )
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 255, 0, 1)'))
        .then(() =>
          replaceInFile(indexHtml, 'body', "body(style='background: rgba(255, 0, 0, 1)')")
        )
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 0, 0, 1)'))
        .then(() =>
          appendToFile(scripts, 'document.body.style.background = `rgba(255, 255, 255, 1)`;')
        )
        .then(() => helpers.waitForCss('body', 'background-color', 'rgba(255, 255, 255, 1)'))
        .then(() => appendToFile(styles, 'body { display: flex }'))
        .then(() => delay(1000));
    });

    it('should render correct files after changes', function() {
      return fetch(stylesUrl)
        .then(res => res.text())
        .then(css => expect(css, 'to contain', 'display:flex').and('not to contain', '-ms-flexbox'))
        .then(() => fetch(scriptsUrl).then(res => res.text()))
        .then(js => expect(js, 'to contain', '"rgba(255, 255, 255, 1)";'));
    });

    it('should also live-reload after included files are added and edited', function() {
      return new Promise(resolve =>
        resolve(appendToFile(styles, 'p { background: rgba(0, 255, 0, 1) }'))
      )
        .then(() => helpers.waitForCss('p', 'background-color', 'rgba(0, 255, 0, 1)'))
        .then(() =>
          addFile(
            path.join(fixturesPath, '_inner.scss'),
            path.join(projectPath, 'styles', '_inner.scss')
          )
        )
        .then(() => appendToFile(styles, "@import '_inner';"))
        .then(() => helpers.waitForCss('h1', 'background-color', 'rgba(0, 128, 0, 1)'))
        .then(() =>
          appendToFile(path.join(projectPath, 'styles', '_inner.scss'), 'h1 { background: purple }')
        )
        .then(() => helpers.waitForCss('h1', 'background-color', 'rgba(128, 0, 128, 1)'))
        .then(() =>
          addFile(path.join(fixturesPath, '_inner.pug'), path.join(projectPath, '_inner.pug'))
        )
        .then(() => appendToFile(indexHtml, '\n    include _inner.pug'))
        .then(() => delay(1000))
        .then(() => expect(wd.find('#included'), 'to exist'))
        .then(() =>
          appendToFile(path.join(projectPath, '_inner.pug'), "\ndiv(id='alsoIncluded') Yo")
        )
        .then(() => delay(1000))
        .then(() => expect(wd.find('#alsoIncluded'), 'to exist'))
        .then(
          () =>
            new Promise((resolve) => {
              spawned.childProcess.on('exit', resolve);
              spawned.childProcess.kill();
            })
        );
    });

    it('should add ejs to site', function() {
      if (/^win/.test(process.platform)) {
        return spawn('cmd.exe', ['/c', 'npm.cmd', 'install', 'ejs', '--save-dev'], {
          cwd: projectPath,
        });
      } else {
        return spawn('npm', ['install', 'ejs', '--save-dev'], {
          cwd: projectPath,
        });
      }
    });

    let spawnedEjs;

    const newIndexHtml = path.join(projectPath, 'index.ejs');
    const newInnerHtml = path.join(projectPath, '_inner.ejs');

    it('should serve ejs site', function() {
      try {
        fs.unlinkSync(indexHtml);
        addFile(path.join(fixturesPath, 'index.ejs'), newIndexHtml);
      } catch (e) {}

      spawnedEjs = spawn('node', ['../../cli.js', 'dev', '--no-open'], {
        cwd: projectPath,
      }).catch((err) => {});

      return helpers
        .isServingSite(spawnedEjs.childProcess.stdout)
        .then((url) => {
          siteUrl = url.split('\n')[0];
          return wd.goto(siteUrl);
        })
        .then(() => wd.find('html').getAttribute('innerHTML'))
        .then(() => expect(wd.find('script'), 'to exist'))
        .then(() => expect(wd.find('h2'), 'to contain text', 'Hello World'));
    });

    it('should also live-reload after included files are added and edited', function() {
      addFile(path.join(fixturesPath, '_inner.ejs'), newInnerHtml);
      appendToFile(newIndexHtml, "\n<%- include('_inner'); %>");
      return delay(1000)
        .then(() => expect(wd.find('#included-ejs'), 'to exist'))
        .then(() =>
          appendToFile(
            path.join(projectPath, '_inner.ejs'),
            '\n<div id="second-included-ejs">Yo</div>'
          )
        )
        .then(() => delay(1000))
        .then(() => expect(wd.find('#second-included-ejs'), 'to exist'))
        .then(() => addAutoprefixConfig());
      // TODO Test for autoprefix;
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

    // after(function(done) {
    //   fs.unlinkSync(pingyJsonPath);
    //   fs.unlinkSync(indexPath);
    //   rimraf(distDir, () => rimraf(scriptsDir, () => rimraf(stylesDir, done)));
    // });

    it('should export site (minified)', function() {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": false,', '"minify": true,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      return hasExportedSite(
        spawn('node', ['../../cli.js', 'export'], {
          cwd: projectPath,
        })
      ).then(() =>
        expect.promise.all({
          dir: expect(fs.existsSync(distDir), 'to be true'),
          shas: expect(fs.existsSync(shas), 'to be true'),
          index: expect(
            fs.readFileSync(distIndexPath, 'utf8'),
            'to contain',
            '<div id="second-included-ejs">Yo</div>'
          ),
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

      return hasExportedSite(
        spawn('node', ['../../cli.js', 'export'], {
          cwd: projectPath,
        })
      ).then(() =>
        expect.promise.all({
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display: -webkit-box'
          ),
        })
      );
    });

    it('should export site (autoprefixed)', () => {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent
        .replace('"minify": true,', '"minify": false,')
        .replace('"autoprefix": "> 5%"', '"autoprefix": true');
      fs.writeFileSync(pingyJsonPath, newPingyContent);
      changeBackAutoprefixConfig();

      return hasExportedSite(
        spawn('node', ['../../cli.js', 'export'], {
          cwd: projectPath,
        })
      ).then(() =>
        expect.promise.all({
          dir: expect(fs.existsSync(distDir), 'to be true'),
          shas: expect(fs.existsSync(shas), 'to be true'),
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display: -webkit-box;\n  display: -ms-flexbox;'
          ),
        })
      );
    });

    it('should export site (autoprefixed + minified)', () => {
      const pingyContent = fs.readFileSync(pingyJsonPath, 'utf8');
      const newPingyContent = pingyContent.replace('"minify": false,', '"minify": true,');
      fs.writeFileSync(pingyJsonPath, newPingyContent);

      return hasExportedSite(
        spawn('node', ['../../cli.js', 'export'], {
          cwd: projectPath,
        })
      ).then(() =>
        expect.promise.all({
          styles: expect(
            fs.readFileSync(stylesDistFile, 'utf8'),
            'to contain',
            'display:-webkit-box'
          ),
        })
      );
    });

    it('should export site (after edit)', () => {
      const css = fs.readFileSync(styles, 'utf8');
      const newCss = `${css}\nh4 { display: flex }`;
      fs.writeFileSync(styles, newCss);

      return hasExportedSite(
        spawn('node', ['../../cli.js', 'export'], {
          cwd: projectPath,
        })
      ).then(() =>
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
