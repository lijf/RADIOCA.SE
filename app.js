
/**
 * Module dependencies.
 */

var express = require('express'),
    formidable = require('formidable'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    url = require('url'),
    fs = require('fs'),
    formidable = require('formidable'),
    requestHandlers = require("./requestHandlers"),
    sys = require('sys'),
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
    "caseid": "1",
    "page": "1",
    "radios": ["123", "123"],
    "texts": ["__Text 1__ ", "Text 2"]
    };
 console.log('caseid:' + case1.caseid);
 console.log('page:' + case1.page);
 redisClient.set("case:" + case1.caseid + ":page:" + case1.page, JSON.stringify(case1));


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
      caseid: theCase.caseid,
      page: theCase.page,
      title: theCase.title,
      scripts: ['jquery.mousewheel.min.js', 'showdown.js', 'stacks.js'],
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
      caseid: theCase.caseid,
      page: theCase.page,
      scripts: ['jquery.mousewheel.min.js','ui/jquery.ui.core.js', 'ui/jquery.ui.widget.js', 'ui/jquery.ui.mouse.js', 'ui/jquery.ui.draggable.js', 'showdown.js', 'stacks.js'],
      radios: theCase.radios,
      texts: theCase.texts
    });
  });
});

app.post('/case', function(req, res){
  console.log('POST /case was called');
  console.log(req.body);
  console.log(req.body.caseid);
});

//  console.log(form);

//  form
//    .on('field', function(field, value) {
//      console.log(field, value);
//    })
//    .on('end', function() {
//      console.log('-> post done');
//    });
//  var thisCase {
//     "title" : req.params.title,
//     "radios" : req.params.radios,
//     "texts" : req.params.texts
//  }

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
