require.paths.unshift('./node_modules');

/**
 * Module dependencies.
 */

var express = require('express')
   ,everyauth = require('everyauth')
   ,git_config = require("./config/github")
   ,session_config = require("./config/session");

/**
 * OAuth Setting
 */
everyauth
  .github
    .myHostname(git_config.host)
    .appId(git_config.appId)
    .appSecret(git_config.appSecret)
    .entryPath(git_config.entryPath)
    .callbackPath(git_config.callbackPath)
    .scope('public_repo')
    .findOrCreateUser( function (session, accessToken, accessTokenExtra, githubUserMetadata) {
      return {name:githubUserMetadata.user};
    })
    .redirectPath('/auth/github/loginhook');

var app = module.exports = express.createServer(
    express.bodyParser()
  , express.methodOverride()
  , express.static(__dirname + "/public")
  , express.cookieParser()
  , express.session({ secret: session_config.secret})
  , everyauth.middleware()
);
everyauth.helpExpress(app);

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


// Routes
app.get('/', function(req, res){
  res.render('index', {
    title: 'Express' 
  });
});

app.get('/auth/github/loginhook', function(req, res){
  console.log(req.loggedIn);
  console.log(req.user);
  res.redirect('/');
});


var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});