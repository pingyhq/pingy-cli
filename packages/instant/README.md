# instant – transparent live-reloading

[![Build Status](https://travis-ci.org/fgnass/instant.png)](https://travis-ci.org/fgnass/instant)

Instant is ultra lightweight live-reload implementation with a unique feature set:


* Works in all browsers including mobile devices and IE6
* No browser plugin required
* Can be used as drop-in replacement for the express.static() middleware
* Production mode with zero overhead
* Automatic client code injection

## How it works

All static files that are served by the middleware are added to a watch list. Whenever one of these files is modified the client gets notified an reloads the resource. CSS files are updated without reloading the whole page.

Instant automatically injects a script-tag right before the closing `body` tag
of any HTML page (including dynamic ones) in order to load the client code.

The client uses
[server-sent events](http://en.wikipedia.org/wiki/Server-sent_events) to
listen for updates. Browsers that don't support EventSource will fall back to a
[hidden iframe](http://en.wikipedia.org/wiki/Comet_%28programming%29#Hidden_iframe).


## Usage

```js
var express = require('express');
var instant = require('instant');

var app = express();
app.use(instant(__dirname + '/static'));
```

If `$NODE_ENV` is set to `production` or `{ bypass: true }` is passed as option, instant will behave just like `express.static()` with no additional overhead.

### Reloading dynamic files

The instant middlware also exposes a `.reload()` function that can be called to
reload arbitrary URLs. This can be useful if you want to reload scripts or
stylesheets that have been processed/compiled on the fly.

Note: If you don't want to server any static files at all you can safely omit
the  `root` argument.

```js
var express = require('express');
var instant = require('instant');

var app = express();
var ins = instant();

app.use(ins);

app.get('/tick', function(req, res) {
  res.send('Current date: ' + new Date());
});

// Trigger a reload of the page every 10 seconds:
setInterval(function() {
  ins.reload('/tick');
}, 10000);
```

### Options

The following options are supported:

* __bypass__ If set to `true` instant will behave just like express.static(). Defaults to `process.env.NODE_ENV == 'production'`
* __watch__ List of file extensions to watch. Defaults to `['html', 'js', 'css']`
* __prefix__ A prefix to add to the URLs under which the client script and the EventSource are exposed. Defaults to `'/instant'`
* __delay__ Amount of time in milliseconds to wait before triggering a reload. Defaults to `10`

All other options like `etag`, `dotfiles`, `index`, etc. are passed on to [send](https://www.npmjs.com/package/send).

## instant(1)

There is also an `instant` binary that can be used to spawn a development
server in the current directory.
The [instant-server](https://github.com/fgnass/instant-server) is packaged as
speparate module and can be installed via npm:

```
npm install -g instant-server
```

![screenshot](http://fgnass.github.io/images/instant.gif)

### The MIT License (MIT)

Copyright (c) 2013-2015 Felix Gnass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
