Piggy In The Middle
===================

Express/Connect middleware for transpiling to html/css/js on-the-fly. Also gives you sourcemaps and caching for unchanged files.

This is a very early version with almost no test coverage but give it a shot and report any issues. Currently supports: `LiveScript`, `babel`, `coco`, `coffee-script`, `dogescript`, `less`, `marked`, `myth`, `jade`, `node-sass`, `stylus`, `swig`.

It works a bit like this:
  1. A request comes in for `app.js`
  2. `app.js` can not be found (`404`)
  3. PITM will look for files that compile to `app.js`
  4. It finds `app.coffee`
  5. `app.coffee` is compiled on-the-fly
  6. The compiled output is served to the browser as `app.js`

Subsequent requests will not force a recompile file because PITM will cache the output. PITM is smart and will watch the source file(s) for changes, if you change a source file then it will do a recompile on next request.

**Note: You'll need a recent version of Node.js (like `v4.2.1`) because this lib uses ES2015 features (alternatively you can run the lib through babelify).**


Try it out
----------  
The easiest way to try this out is to `clone` the repo, `cd` into it and do:

```sh
npm install
npm run example
```

This will start a basic demo site using PITM.


Use as middleware
-----------------
Here's a really simple example.

```javascript
var connect = require('connect');
var http = require('http');
var serveStatic = require('serve-static');
var pitm = require('piggy-in-the-middle');

var app = connect();

app.use(serveStatic('/path/to/your/site'));
app.use(pitm('/path/to/your/site'));

http.createServer(app).listen(3000);
```
