
/**
 * Module dependencies.
 */

var express = require('express'),
    formidable = require('formidable'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    url = require('url'),
    fs = require('fs'),
    requestHandlers = require("./requestHandlers"),
    redis = require('redis'),
    redisClient = redis.createClient();

 

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Data Store

redisClient.on("error", function(err) {
  console.log("Error " + err);
});

 var case1 = {
    "title": "case1",
    "radios": [{"x": "0px", "y": "0px", "url": "123"},
               {"x": "0px", "y": "0px", "url": "123"}],
    "texts": [{"x": "0px", "y": "0px", "content": "Text 1"},
              {"x": "0px", "y": "0px", "content": "Text 2"}]
    };
 redisClient.set("case:1:page:1", JSON.stringify(case1));


// redisClient.set("string key", "string val", redis.print);
// redisClient.incr("numberOfCases", redis.print);
// redisClient.hset("hash key", "hashtest 1", "some value", redis.print);
// redisClient.hset(["hash key", "hashtest 2", "some other value"], redis.print);
// redisClient.hkeys("hash key", function (err, replies) {
//   console.log(replies.length + " replies:");
//   replies.forEach(function (reply, i) {
//     console.log("     " + i + ": " + reply);
//  });
//  redisClient.quit();
// });


// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: 'Express'
  });
});

app.get('/case/:id/:page', function(req, res){
  var findCase="case:"+req.params.id+":page:"+req.params.page;
  redisClient.get(findCase, function( err, data) {
  var theCase = JSON.parse( data.toString() );
  res.render('case', {
      title: theCase.title,
      layout: theCase.layout,
      scripts: ['jquery.mousewheel.min.js', 'stacks.js'],
      radios: theCase.radios,
      texts: theCase.texts
    });
  });
});

app.get('/case/:id/:page/edit', function(req, res){
  var findCase="case:"+req.params.id+":page:"+req.params.page;
  redisClient.get(findCase, function( err, data) {
  var theCase = JSON.parse( data.toString() );
  res.render('case-edit', {
      title: theCase.title,
      layout: theCase.layout,
      scripts: ['jquery.mousewheel.min.js','ui/jquery.ui.core.js', 'ui/jquery.ui.widget.js', 'ui/jquery.ui.mouse.js', 'ui/jquery.ui.draggable.js', 'stacks.js'],
      radios: theCase.radios,
      texts: theCase.texts
    });
  });
});

app.get('/image/:id', function(req, res){
  var image = __dirname + '/img/' + req.params.id + '.jpg';
  fs.readFile(image, "binary", function(error, file){
    if(error) {
    } else {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.write(file, "binary");
      res.end();
    }
  });
});

app.get('/upload', function(req, res){
  res.render('upload', {
    imageid: '123', 
    title: 'upload'
  });
});

app.post('/image/', function(req, res){
  requestHandlers.postImage(req, res);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
