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
    .myHostname('http://geek_meets_designer.cloudfoundry.com')
    .appId(git_config.appId)
    .appSecret(git_config.appSecret)
    .entryPath('/auth/github')
    .callbackPath('/auth/github/callback')
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


//var host = process.env.VCAP_APP_HOST || 'localhost';
var port = process.env.port || 3000;

app.listen(port);
//app.listen(port, host);
//console.log('application run !! http://' + host + ':' + port );
