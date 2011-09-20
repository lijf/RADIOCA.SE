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
    db = require('redis').createClient(),
    zip = require('zip'),
    //oauth = require('oauth');
    easyoauth = require('easy-oauth');
    // authCheck = require('./authCheck.js');

var app = module.exports = express.createServer();

// Configuration

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'eventuallycloseduringnative' }));
    app.use(require('stylus').middleware({ src: __dirname + '/public' }));
    app.use(easyoauth(require('./keys_file')));
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
        {"img":"1313337540668", "caption":"EDH 1"}
    ],
    "texts": ["---"],
    "creator" : "lijf"
};

function include(arr,obj) {
    return (arr.indexOf(obj) != -1);
}

//db.set("case:" + case1.caseid + ":page:" + case1.page, JSON.stringify(case1));


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
        title: 'RadioCase',
        styles: ['reset.css','style.css'],
        scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js']
    });
});

app.get('/newcase', function(req, res){
  res.render ('newcase',{
      title: 'RadioCase - create new case',
      styles: ['reset.css','style.css'],
      scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js']
  });
});

app.post('/newcase', function(req, res){
   if(req.isAuthenticated()){
      var data = req.body;
      data.creator = req.getAuthDetails().user.username;
      console.log(data);
      db.incr('number_of_cases', function(err, casenumber){
        var caseurl = 'case:' + casenumber;
        db.set(caseurl + ':page:1', JSON.stringify(data),
            function(err){
                db.sadd(caseurl + ':users', req.getAuthDetails().user.user_id,
                    function(){
                    console.log('created ' + caseurl);
                    res.send('/case/' + casenumber +'/1',200);
                });
        });
    });
   }
   else{res.send('FORBIDDEN', 403)};
});

app.get('/ziptest', function(req, res){
    var zipfile = fs.readFileSync(__dirname + "/SD.zip");
    var reader = zip.Reader(zipfile);
    console.log(reader.readLocalFileHeader());
    console.log(reader.readDataDescriptor());
    var i = 0;
    reader.forEach(function(entry){
            var matchimage = /\.(jpg|jpeg|png|gif)$/i;
            if(matchimage.test(entry.getName())){
              console.log(entry.getName());
            }
            console.log(i++);
        });
});

app.get('/test', function(req, res) {
    res.send('<html><body><p>Test</body></html>');
});

app.get('/case/:id/:page', function(req, res) {
    console.log('GET case/' + req.params.id + '/' + req.params.page);
    var findCase = "case:" + req.params.id + ":page:" + req.params.page;
    var uid = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.user_id}
        else {return "0"}};
    var username = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.username}
        else {return "0"}};
    db.smembers('case:' + req.params.id + ':users', function(err, editors){
        console.log('case editors ' + editors);
        var editor=0;
        var edit_or_feedback;
        var editfeedbacktext = "Feedback";
        if(include(editors, uid())){
            console.log('found in editors');
            edit_or_feedback="editbutton";
            editfeedbacktext="Edit";
            editor=1;
        } else {
            edit_or_feedback="feedbackbutton"
        }
        db.mget(findCase, "markdown-help", function(err, data){
            // console.dir(data);
            if(!data[0]){return res.send("huh?", 404);} else {
            console.log(data[0]);
            var theCase = JSON.parse(data[0].toString());
            var mdhelp = JSON.parse(data[1].toString());
            return res.render('case', {
                title: theCase.title || 'untitled',
                styles: ['reset.css','style.css'],
                scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js'],
                radios: theCase.radios || '',
                texts: theCase.texts || '',
                creator: theCase.creator || '',
                mdhelp: mdhelp,
                edit_or_feedback: edit_or_feedback,
                editfeedbacktext: editfeedbacktext,
                signed_in: req.isAuthenticated(),
                user: username(),
                editor: editor
            });
            }
          });
    });
 });

app.get('/signed_in', function(req, res){
   var uid =  req.getAuthDetails().user.user_id;
   var userdata = JSON.stringify(req.getAuthDetails());
   db.set('user:' + uid, userdata, function(err, data){
       db.sismember('users', uid, function(err, data){
           if(!data){
               db.sadd('users', uid);
               res.send("new user", 200);
           }
       });
   });
});

app.get('/case/:id/:page/edit', function(req, res) {
    console.dir(req.isAuthenticated());
    console.dir(req.getAuthDetails().user.user_id);
    console.dir(req.getAuthDetails());
    if (req.isAuthenticated()) {
        db.get("case:" + req.params.id + ":page:" + req.params.page, function(err, data) {
            if (!data[0]) {
                return res.send("huh?", 404);
            }
            else db.sismember('case:' + req.params.id + ':users',
                req.getAuthDetails().user.user_id,
                function(err, editor){
                console.dir(editor);
                if(editor){
                console.dir("user allowed")
                //console.dir(JSON.parse(data.toString()).users);
                res.render('edit', {
                    title: "edit",
                    styles: ['style.css'],
                    scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js','client.js'],
                    caseid: req.params.id,
                    page: req.params.page
                });
                }
                else {res.send("You are not allowed to edit this page but you can ask the author to add you as an editor", 200)}
            });
        });
    }
    else {res.send("Please log in to edit pages", 200)}
});

app.put('/case/:id/:page', function(req, res) {
    db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor){
            if(editor){
                var data = req.body;
                db.set('case:' + req.params.id + ':page:' + req.params.page, JSON.stringify(data));
                console.log('saved page');
                res.send('OK', 200)
            }
            else{res.send('FORBIDDEN', 403)};
    });
});

app.get('/sign_out', function(req, res, params){
    req.logout();
    res.send('<button id="twitbutt">Sign in with twitter</button>');
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
    if(req.isAuthenticated()){
        requestHandlers.postImage2(req,res, db);
    }
    else {res.send("not logged in", 200)}
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
    console.dir(process.env);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
