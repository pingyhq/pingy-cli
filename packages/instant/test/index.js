/* global describe, it */

var instant = require('..')
  , http = require('http')
  , request = require('supertest')
  , assert = require('assert')
  , read = require('fs').readFileSync

var ins = instant(__dirname + '/fixture')
  , app = http.createServer(ins)

describe('instant', function() {
  it('should inject the client script', function(done) {
    request(app)
      .get('/index.html')
      .expect(/<script src="\/instant\/client\/bundle\.js"><\/script>/, done)
  })

  it('should serve the client script', function(done) {
    request(app)
      .get('/instant/client/bundle.js')
      .expect(read(__dirname + '/../client/bundle.js', 'utf8'), done)
  })

  it('should expose an EventSource', function(done) {
    request(app)
      .get('/instant/events/')
      .set('Accept', 'text/event-stream')
      .buffer(false)
      .expect('Content-Type', 'text/event-stream')
      .parse(waitFor(/data: {"token":\d+}/))
      .end(done)
  })

  it('should allow manual reloads', function(done) {
    var parse = waitFor(/data: {"url":"\/foo"}/)
    var reloaded
    request(app)
      .get('/instant/events/')
      .set('Accept', 'text/event-stream')
      .buffer(false)
      .parse(function(res, cb) {
        if (!reloaded) ins.reload('/foo')
        reloaded = true
        parse(res, cb)
      })
      .end(done)
  })

  it('should expose an forever iframe', function(done) {
    request(app)
      .get('/instant/events/')
      .expect('Content-Type', 'text/html')
      .buffer(false)
      .parse(waitFor(/handleSentEvent/))
      .end(done)
  })
})


function waitFor(re) {
  return function(res, done) {
    var s = ''
    res.on('data', function(data) {
      s += data
      if (re.exec(s)) {
        res.destroy()
        done()
      }
    })
  }
}
