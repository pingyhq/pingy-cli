'use strict';

const sendevent = require('sendevent/index.js');
const inject = require('./inject');
const serve = require('./serve');
const stack = require('stacked');
const filewatcher = require('filewatcher');

// timestamp to detect server-restarts
const startup = Date.now();

module.exports = function instant(root, opts) {
  if (typeof root === 'object') {
    opts = root;
    root = opts.root;
  }

  if (!opts) opts = {};

  const fn = stack();
  fn.reload = function() {};

  // bypass in production
  let bypass = opts.bypass;
  if (bypass === undefined) bypass = process.env.NODE_ENV == 'production';

  let connectedClients = [];

  if (!bypass) {
    // the prefix under which the eventstream and the client is exposed
    const prefix = opts.prefix || '/instant';

    const events = sendevent(`${prefix}/events`);

    fn
      .use(events)
      .use(inject(`${prefix}/client/bundle.js`))
      .mount(`${prefix}/client`, serve(`${__dirname}/../client`));

    // when a client connects send the startup time
    events.on('connect', client => {
      let heartbeat = 0;
      let heartbeatInterval;
      const heartbeatFn = function heartbeatFn() {
        if (connectedClients.indexOf(client.id) === -1) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          return;
        }
        client.send({ heartbeat });
        heartbeat++;
      };

      connectedClients.push(client.id);
      client.send({ token: startup });

      heartbeatInterval = setInterval(heartbeatFn, 10 * 1000); // 10 seconds
      setTimeout(heartbeatFn, 1000);
    });

    events.on('disconnect', client => {
      connectedClients = connectedClients.filter(
        clientId => clientId !== client.id
      );
    });

    fn.reload = function reloadFn(ev) {
      if (typeof ev === 'string') ev = { url: ev };
      if (ev) events.broadcast(ev);
    };

    if (root && opts.watch !== false) {
      const urlsByFile = {};
      const watcher = filewatcher({ delay: opts.delay });

      // when a file is modifed tell all clients to reload it
      watcher.on('change', file => {
        fn.reload(urlsByFile[file]);
      });

      // build a RegExp to match all watched file extensions
      const exts = opts.watch || ['html', 'js', 'css'];
      const re = new RegExp(`\\.(${exts.join('|')})$`);

      // pass an `onfile` handler that watches matching files
      opts = Object.create(opts, {
        onfile: {
          value(path) {
            if (!re.test(path)) return;
            urlsByFile[path] = this.path;
            this._maxage = 0;
            watcher.add(path);
          },
        },
      });
    }
  }

  if (root) {
    fn.use(serve(root, opts));
  }

  return fn;
};
