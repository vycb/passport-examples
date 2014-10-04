// dependencies
var fs = require('fs'),
http = require('http'),
express = require('express'),
session = require('express-session'),
logger = require('morgan'),
bodyParser = require('body-parser'),
cookieParser = require('cookie-parser'),
methodOverride = require('method-override'),
favicon = require('serve-favicon'),
routes = require('./routes'),
path = require('path'),
mongoose = require('mongoose'),
config = require('./oauth.js'),
User = require('./user.js');
passport = require('passport');
auth = require('./authentication.js'),
RedisStore = require('connect-redis')(session),
app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(cookieParser());
app.use(session({
	resave: false, // don't save session if unmodified
	saveUninitialized: false, // don't create session until something stored
	secret: '12345',
	store: new RedisStore({port: 11548, host: 'pub-redis-11548.us-east-1-3.2.ec2.garantiadata.com'/*, client: redis*/})
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(function errorHandler(err, req, res, next) {
	console.error(err.stack);
	res.status(500).send('Something broke!');
	res.render('error', { error: err });
});

// mongo config
var MONGOLAB_URI= "mongodb://vycb:123@ds039010.mongolab.com:39010/blog",
		mongo = process.env.MONGOLAB_URI || 'mongodb://localhost/node-bootstrap3-template';
mongoose.connect(MONGOLAB_URI);

// seralize and deseralize
passport.serializeUser(function(user, done) {
    console.log('serializeUser: ' + user._id)
    done(null, user._id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user){
        console.log(user);
        if(!err) done(null, user);
        else done(err, null);
    })
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/account', ensureAuthenticated, function(req, res){
  User.findById(req.session.passport.user, function(err, user) {
    if(err) {
      console.log(err);
    } else {
      res.render('account', { user: user})
    }
  })
})
app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
  });
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });
app.get('/auth/twitter',
  passport.authenticate('twitter'),
  function(req, res){
  });
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });
app.get('/auth/github',
  passport.authenticate('github'),
  function(req, res){
  });
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });
app.get('/auth/google',
  passport.authenticate('google'),
  function(req, res){
  });
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/account');
  });
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(app.get('port'), function(){
	console.log('\nExpress server listening on port ' + app.get('port'));
});

// test authentication
function ensureAuthenticated(req, res, next) {
	  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = app
