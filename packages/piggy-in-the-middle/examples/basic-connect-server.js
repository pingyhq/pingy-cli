var connect = require('connect');
var http = require('http');
var path = require('path');
var serveStatic = require('serve-static');
var pitm = require('../lib/piggy-in-the-middle');

var app = connect();

app.use(serveStatic(path.join(__dirname, '/site/')));
app.use(pitm(path.join(__dirname, '/site/')));

//create node.js http server and listen on port
http.createServer(app).listen(3000);
console.log('Check out http://localhost:3000/');
