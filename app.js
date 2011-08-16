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
    sys = require('sys'),
    db = require('redis').createClient();


var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
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

app.configure('development', function() {
    // app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
    app.use(express.errorHandler());
});

app.error(function(err, req, res, next) {
    sys.puts("APP.ERROR:" + sys.inspect(err));
    next(err);
});


// Data Store

db.on("error", function(err) {
    console.log("Redis Error " + err);
});

var case1;
case1 = {
    "title": "case1",
    "caseid": "1",
    "page": "1",
    "radios": [
        {"img":"123", "caption":"EDH 1"},
        {"img":"123", "caption":"EDH 2"}
    ],
    "texts": ["---"]
};

// redisClient.set("case:" + case1.caseid + ":page:" + case1.page, JSON.stringify(case1));


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

app.get('/', function(req, res) {
    res.render('index', {
        title: 'Express'
    });
});

app.get('/test', function(req, res) {
    res.send('<html><body><p>Test</body></html>');
});

app.get('/case/:id/:page', function(req, res) {
    console.log('GET case/' + req.params.id + '/' + req.params.page);
    var findCase = "case:" + req.params.id + ":page:" + req.params.page;
    db.mget(findCase, "markdown-help", function(err, data){
        // console.dir(data);
        if(!data[0]){return res.send("huh?", 404);} else {
        // console.log(data[0]);
        var theCase = JSON.parse(data[0].toString());
        var mdhelp = JSON.parse(data[1].toString());
        return res.render('case', {
            title: theCase.title,
            styles: ['style.css'],
            scripts: ['jquery.mousewheel.min.js', 'showdown.js', 'client.js'],
            radios: theCase.radios,
            texts: theCase.texts,
            mdhelp: mdhelp
        });
        }
    });
 });

app.get('/case/:id/:page/edit', function(req, res) {
    res.render('edit', {
        title: "edit",
        styles: ['style.css'],
        scripts: ['jquery.mousewheel.min.js','showdown.js','client.js'],
        caseid: req.params.id,
        page: req.params.page
    });
});

app.put('/case/:id/:page', function(req, res) {
    console.log('PUT /case was called');
    var data = req.body;
    db.set("case:" + req.params.id + ":page:" + req.params.page, JSON.stringify(data));
});

app.get('/image/:id', function(req, res) {
    var image = __dirname + '/img/' + req.params.id + '.jpg';
    fs.readFile(image, "binary", function(error, file) {
        if (error){ return res.send("huh?", 404);} else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/jpeg');
            res.write(file, "binary");
            res.end();
        }
    });
});

app.post('/image/', function(req, res) {
    console.log("POST /image/ called");
    requestHandlers.postImage(req,res, db);
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
