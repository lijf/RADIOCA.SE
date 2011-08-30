const fbId = ""; #x
const fbSecret = ""; #y
const fbCallbackAddress= "http://localhost:4000/auth/facebook";
//var RedisStore = require('connect-redis');
var express= require('express');
var auth= require('connect-auth')
var app = express.createServer();
app.configure(function(){
  app.use(express.cookieDecoder());
  app.use(express.logger());
  //app.use(connect.session({ store: new RedisStore({ maxAge: 10080000 }) }));
  app.use(express.session());
  app.use(auth( [
    auth.Facebook({appId : fbId, appSecret: fbSecret, scope: "email", callback: fbCallbackAddress})
  ]) );
});


app.get('/logout', function(req, res, params) {
    req.logout();
    res.writeHead(303, { 'Location': "/" });
    res.end('');
});

app.get('/', function(req, res, params) {
    if( !req.isAuthenticated() ) {
        res.send('<html>                                              \n\
          <head>                                             \n\
            <title>connect Auth -- Not Authenticated</title> \n\
            <script src="http://static.ak.fbcdn.net/connect/en_US/core.js"></script> \n\
          </head><body>                                             \n\
            <div id="wrapper">                               \n\
              <h1>Not authenticated</h1>                     \n\
              <div class="fb_button" id="fb-login" style="float:left; background-position: left -188px">          \n\
                <a href="/auth/facebook" class="fb_button_medium">        \n\
                  <span id="fb_login_text" class="fb_button_text"> \n\
                    Connect with Facebook                    \n\
                  </span>                                    \n\
                </a>                                         \n\
              </div></body></html>');
    } else {
         res.send( JSON.stringify( req.getAuthDetails()) );
    }
});

// Method to handle a sign-in with a specified method type, and a url to go back to ...
app.get('/auth/facebook', function(req,res) {
  req.authenticate(['facebook'], function(error, authenticated) {
     if(authenticated ) {
        res.send("<html><h1>Hello Facebook user:" + JSON.stringify( req.getAuthDetails() ) + ".</h1></html>")
      }
      else {
        res.send("<html><h1>Facebook authentication failed :( </h1></html>")
      }
   });
});

app.listen(4000);