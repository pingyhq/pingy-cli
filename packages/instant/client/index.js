'use strict';

var on = require('sendevent');
var parse = require('./url');
var find = require('./find');
var add = require('./add');
var connectionLost = require('./connectionLost');

var token;
var latestHeartbeatTime;

on('/instant/events', function onEv(ev) {
  if (ev.token) {
    if (!token) token = ev.token;
    if (token !== ev.token) {
      location.reload();
      return;
    }
    setInterval(function heartbeat() {
      if (latestHeartbeatTime) {
        var diff = Date.now() - latestHeartbeatTime;
        if (diff > 1000 * 12) connectionLost();
      }
    }, 1000 * 10);
  }

  if (typeof ev.heartbeat === 'number') {
    latestHeartbeatTime = Date.now();
  }

  // reload page if it contains an element with the given class name
  if (ev.className) {
    if (find.byClass(ev.className)) location.reload();
    return;
  }

  // reload page if it contains an element that matches the given selector
  if (ev.selector) {
    if (find.bySelector(ev.selector)) location.reload();
    return;
  }

  // resolve the URL
  var url = parse(ev.url);

  // Remove query and hash strings
  var normalizedLocationHref = location.href.split('#')[0].split('?')[0];

  // reload the page
  if (url.href.replace('index.html', '') === normalizedLocationHref) {
    location.reload();
    return;
  }

  // look for a stylesheet
  var el = find.byURL('link', 'href', url);
  if (el) {
    var newEl = add(el, url.pathname + '?v' + new Date().getTime(), url);
    newEl.onload = function elOnLoad() {
      var p = newEl.parentNode;
      var els = find.allByURLExceptMe('link', 'href', url, newEl);
      for (var i = 0, n = els.length; i < n; i++) p.removeChild(els[i]);
    };
  }

  // look for a script
  el = find.byURL('script', 'src', url);
  if (el) {
    location.reload();
    return;
  }

  // If we're using script type="module" then reload on every js change
  if (parse.getExt(url.href) === '.js') {
    el = find.bySelector('script[type=module]');

    if (el) {
      location.reload();
    }
  }
});
