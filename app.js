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
    redis = require('redis'),
    db = redis.createClient(),
    zip = require('zip'),
    //oauth = require('oauth');
    easyoauth = require('easy-oauth'),
    form = require('connect-form'),
    redback = require('redback').use(db),
    formidable = require('formidable'),
    // authCheck = require('./authCheck.js');
    util = require('util');


//redis.debug_mode = true;

var app = module.exports = express.createServer(
    form({keepExtensions: true})
);

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
    "radios":
      [{"images":[
         'S1-01','S1-02','S1-03',
         'S1-04','S1-05','S1-06',
         'S1-07','S1-08','S1-09',
         'S1-10','S1-11','S1-12'],
        "caption":"EDH 1"
      }],
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
    var username = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.username}
        else {return "0"}};
    res.render('index', {
        title: ' - Home',
        styles: ['reset.css','style.css'],
        scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js'],
        signed_in: req.isAuthenticated(),
        user: username()
    });
});

app.get('/newcase', function(req, res){
  var username = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.username}
        else {return "0"}};
  res.render ('newcase',{
      title: ' - create new case',
      styles: ['reset.css','style.css'],
      scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js'],
      signed_in: req.isAuthenticated(),
      user: username()
  });
});

app.post('/newcase', function(req, res){
   if(req.isAuthenticated()){
      var data = req.body;
      data.creator = req.getAuthDetails().user.username;
      //console.log(data);
      db.incr('number_of_cases', function(err, casenumber){
        //console.dir(data);
        data.cid = casenumber.toString();
        casedata=JSON.stringify(data);
        db.lpush('cases', data);
        db.sadd('cases:' + data.creator, casedata);
        var caseurl = 'case:' + casenumber;
        db.set(caseurl + ':page:1', casedata,
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

app.get('/cases/:start/:finish', function(req, res){
   var start = parseInt(req.params.start, 10);
   var end = parseInt(req.params.finish, 10);
   var username = function(){
      if(req.isAuthenticated()){return req.getAuthDetails().user.username}
      else {return "0"}};
   db.lrange('cases', start, end, function(err, data){
       if(err){res.send("error", 404)}
       else{
           if(!data[0]){
              console.dir('not found');
              res.render('404', {layout: false });
          }else{
           var i = 0;
           var sendcases = [];
           while(data[i]){
               sendcases[i] = JSON.parse(data[i].toString());
               i++;
           }
              //console.dir(sendcases);
              //var sendcases = JSON.parse(data[0]);
              console.dir(sendcases);
              res.render('cases', {
                   title: ' - Cases',
                   styles: ['reset.css','style.css'],
                   scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js', 'client.js'],
                   signed_in: req.isAuthenticated(),
                   user: username(),
                   cases: sendcases
            });
          }
    }
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
        //console.log('case editors ' + editors);
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
            //console.dir(data);
            if(!data[0]){return res.send("huh?", 404);} else {
            //console.log(data[0]);
            var theCase = JSON.parse(data[0].toString());
            var mdhelp = JSON.parse(data[1].toString());
            //console.dir(theCase);
            return res.render('case', {
                title: ' - ' + theCase.title || ' - untitled',
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
    var username = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.username}
        else {return "0"}};
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
                    page: req.params.page,
                    signed_in: req.isAuthenticated(),
                    user: username()
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

app.get('/readme', function(req, res){
   var username = function(){
     if(req.isAuthenticated()){return req.getAuthDetails().user.username}
     else {return "0"}};
   res.render('readme',{
      title: " - README",
      styles: ['style.css'],
      scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js','client.js'],
      signed_in: req.isAuthenticated(),
      user: username()
   });
});

app.get('/colophon', function(req, res){
   var username = function(){
     if(req.isAuthenticated()){return req.getAuthDetails().user.username}
     else {return "0"}};
   res.render('colophon',{
      title: ' - Colophon',
      styles: ['style.css'],
      scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js','client.js'],
      signed_in: req.isAuthenticated(),
      user: username()
   });
});

app.get('/about', function(req, res){
   var username = function(){
     if(req.isAuthenticated()){return req.getAuthDetails().user.username}
     else {return "0"}};
   res.render('about',{
      title: " - About",
      styles: ['style.css'],
      scripts: ['jquery.mousewheel.min.js', 'spin.js', 'showdown.js','client.js'],
      signed_in: req.isAuthenticated(),
      user: username()
   });
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

app.post('/image/', function(req, res){
  console.log('POST /image/ called');
  var day = new Date();
  var d = day.getTime().toString();
  console.log(d);
  var i = 0;
  var form_in = new formidable.IncomingForm(),
      files = [],
      fields = [];
  form_in
    .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
    })
    .on('fileBegin', function(name, file) {
          console.log(file.filename);
          if(file.type='image/jpeg') {
             file.path = __dirname + '/img/' + d + '.' + i + '.jpg';
             i ++;
          }
          console.log(field, file);
          files.push([field, file]);
    })
    .on('end', function() {
        console.log('-> upload done');
        console.log(util.inspect(fields));
        console.log(util.inspect(files));
          // TODO: fix the image montage.
    });
});


app.post('/image_old/', function(req, res) {
    console.log("POST /image/ called");
    if(req.isAuthenticated()){
        requestHandlers.postImage2(req,res);
    }
    else {res.send("not logged in", 200)}
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
    //console.dir(process.env);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
