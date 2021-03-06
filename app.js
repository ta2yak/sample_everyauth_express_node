require.paths.unshift('./node_modules');

/**
 * Module dependencies.
 */

var express = require('express')
   ,everyauth = require('everyauth')
   ,mongoose = require('mongoose')
   ,git_config = require("./config/github")
   ,session_config = require("./config/session");

var db = mongoose.connect(process.env.MONGOHQ_URL);
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    uid: String
  , name: String
  , created_at: { type: Date, default: Date.now }
});
mongoose.model('User', UserSchema);

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
      var promise = new everyauth.Promise();
      var User = mongoose.model('User');
      User.findOne({uid: githubUserMetadata.id}, function (err, foundUser){
        if(err) return promise.fail(err);
        if(foundUser) return promise.fulfill(foundUser);

        var user = new User();
        user.uid = githubUserMetadata.id;
        user.name = githubUserMetadata.login;
        user.save();
        return promise.fulfill(user);
      });

      return promise;
    })
    .redirectPath('/');
    

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

var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Listening on " + port);
});
