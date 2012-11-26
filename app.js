
/**
 * Module dependencies.
 */

var express = require('express')
var http = require('http')
var path = require('path');
var mongoStore = require('connect-mongodb');
var Server = require('mongodb').Server
var server_config = new Server('localhost', 27017, {auto_reconnect: true, native_parser: true})

// var passport = require('passport')
// var LocalStrategy = require('passport-local').Strategy;


var app = express();
var db = require("mongojs").connect("dev", ["users", "sessions"])

function userLoader (req, res, next) {
   if (req.method === 'GET') { 
     // Do some code
   }

   // keep executing the router middleware
   next()
}

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "123dsad", store: new mongoStore({server_config : server_config}) }));
  app.use(express.methodOverride());

  app.use(function(req, res, next){
    res.locals.user = req.session.user || null
    next();
  });

  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.post('/login', function(req, res) {
  var user = req.body.user;
  req.session.user = user;
  res.redirect('/')
});

app.post('/logout', function(req, res) {
  req.session.user = null;
  res.redirect('/')
});

require('./todo')(app)
require('./main')(app)

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
