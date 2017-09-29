var sendevent = require('@pingy/sendevent/index.js')
  , inject = require('./inject')
  , serve = require('./serve')
  , stack = require('stacked')
  , filewatcher = require('filewatcher')

// timestamp to detect server-restarts
var startup = Date.now()

module.exports = function(root, opts) {

  if (typeof root == 'object') {
    opts = root
    root = opts.root
  }

  if (!opts) opts = {}

  var fn = stack()
  fn.reload = function() {}

  // bypass in production
  var bypass = opts.bypass
  if (bypass === undefined) bypass = process.env.NODE_ENV == 'production'

  var connectedClients = []

  if (!bypass) {
    // the prefix under which the eventstream and the client is exposed
    var prefix = opts.prefix || '/instant'

    var events = sendevent(prefix + '/events')

    fn.use(events)
      .use(inject(prefix + '/client/bundle.js'))
      .mount(prefix + '/client', serve(__dirname + '/../client'))

    // when a client connects send the startup time
    events.on('connect', function(client) {
      var heartbeat = 0
      var heartbeatInterval
      var heartbeatFn = function() {
        if (connectedClients.indexOf(client.id) === -1) {
          if (heartbeatInterval) clearInterval(heartbeatInterval)
          return
        }
        client.send({ heartbeat: heartbeat })
        heartbeat++
      }

      connectedClients.push(client.id)
      client.send({ token: startup })

      heartbeatInterval = setInterval(heartbeatFn, 10 * 1000) // 10 seconds
      setTimeout(heartbeatFn, 1000)
    })

    events.on('disconnect', function(client) {
      connectedClients = connectedClients.filter(function(clientId) {
        return clientId !== client.id
      })
    })

    fn.reload = function (ev) {
      if (typeof ev == 'string') ev = { url: ev }
      if (ev) events.broadcast(ev)
    }

    if (root && opts.watch !== false) {
      var urlsByFile = {}
        , watcher = filewatcher({ delay: opts.delay })

      // when a file is modifed tell all clients to reload it
      watcher.on('change', function(file) {
        fn.reload(urlsByFile[file])
      })

      // build a RegExp to match all watched file extensions
      var exts = opts.watch || ['html', 'js', 'css']
        , re = new RegExp('\\.(' + exts.join('|') + ')$')

      // pass an `onfile` handler that watches matching files
      opts = Object.create(opts, {
        onfile: { value: function(path, stat) {
          if (!re.test(path)) return
          urlsByFile[path] = this.path
          this._maxage = 0
          watcher.add(path)
        }}
      })
    }
  }

  if (root) {
    fn.use(serve(root, opts))
  }

  return fn
}
