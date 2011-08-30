var  express= require('express')
   , auth= require('connect-auth');

var app = express.createServer()
  , yourTwitterConsumerKey= ""
  , yourTwitterConsumerSecret= "";

app.configure(function(){
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'foobar' }));
  app.use(auth( [
   auth.Twitter({consumerKey: yourTwitterConsumerKey, consumerSecret: yourTwitterConsumerSecret})
  ]) );
});

app.get('/', function(req, res){
    res.send('Hello World <a href="/secrets">Secrets!</a>');
});

app.get('/secrets', protect, function(req, res){
    res.send('Shhhh!!! Unicorns');
});

function protect(req, res, next) {
  if( req.isAuthenticated() ) next();
  else {
    req.authenticate(["twitter"], function(error, authenticated) {
      if( error ) next(new Error("Problem authenticating"));
      else {
        if( authenticated === true)next();
        else if( authenticated === false ) next(new Error("Access Denied!"));
        else {
          // Abort processing, browser interaction was required (and has happened/is happening)
        }
      }
    })
  }
}

app.listen(4000);