'use strict';

var connect = require('connect');
var path = require('path');
var pitm = require('../');
var instant = require('@pingy/instant');

var app = connect();

var appPath = path.join(__dirname, '/site/');
var ins = instant(appPath);
var piggy = pitm(appPath);

app.use(ins);
app.use(piggy);

piggy.events.on('fileChanged', ins.reload);

//create node.js http server and listen on port
app.listen(3001);
console.log('Check out http://localhost:3001/');
