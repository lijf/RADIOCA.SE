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
    //form = require('connect-form'),
    util = require('util'),
    redis = require('redis'),
    db = redis.createClient(),
    easyoauth = require('easy-oauth');


//redis.debug_mode = true;

var app = module.exports = express.createServer(
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

function include(arr,obj) {
    return (arr.indexOf(obj) != -1);
}
// Routes

app.get('/', function(req, res){
    var username = function(){
        if(req.isAuthenticated()){return req.getAuthDetails().user.username}
        else {return "0"}};
    res.render('index', {
        title: 'Home',
        signed_in: req.isAuthenticated(),
        user: username()
    });
});

app.get('/newcase', function(req, res){
  if(req.isAuthenticated()){
      res.render ('newcase',{
          title: 'Create new case',
          signed_in: req.isAuthenticated(),
          user: req.getAuthDetails().user.username
      });
  } else {res.redirect('/')}
});

app.post('/newcase', function(req, res){
    if(req.isAuthenticated()){
        var data = req.body;
        data.creator = req.getAuthDetails().user.username;
        //console.log(data);
        data.texts = ['Double click to add text'];
        var day = new Date();
        var cid = day.getTime().toString();
        data.cid = cid;
            if(!data.meta_private){ db.lpush('cases', cid)}
            else{db.sadd('private', cid)}
            db.sadd('cases:' + data.creator, cid);
            db.hmset('case:' + cid + ':page:1', data,
                function(err){
                    db.sadd('case:' + cid + ':users', req.getAuthDetails().user.user_id,
                        function(){
                            console.log('created case: ' + cid);
                            res.send('/case/' + cid +'/1',200);
                        });
                });
    }
    else{res.send('FORBIDDEN', 403)}
});

app.get('/cases/:start/:finish', function(req, res){
    if(req.isAuthenticated()){
        var start = parseInt(req.params.start, 10);
        var end = parseInt(req.params.finish, 10);
        db.lrange('cases', start, end, function(err, data){
            if(err){res.send('404', 404)}
            else{
                if(!data[0]){
                    console.log('not found');
                    res.send('404', 404);
                }else{
                    console.log('rendering cases')
                    var i = 0;
                    var sendcases = [];
                    requestHandlers.getCases(req, res, data, i, sendcases, db);
                }
            }
        });
    }else{ res.redirect('/') }
});

app.get('/case/:id/:page', function(req, res) {
    if(req.isAuthenticated()){
        console.log('GET case/' + req.params.id + '/' + req.params.page);
        var findCase = "case:" + req.params.id + ":page:" + req.params.page;
        db.sismember('case:' + req.params.id + ':users',
            req.getAuthDetails().user.user_id,
            function(err, editor){
                db.hgetall(findCase, function(err, theCase){
                    if(err || !theCase.cid){res.redirect('back')} else {
                        if(theCase.meta_private){
                            if(editor){
                              requestHandlers.rendercase(req, res, theCase, editor, db);
                            }else{res.redirect('back');}
                        }else{
                          requestHandlers.rendercase(req, res, theCase, editor, db);
                        }
                    }
                });
            });
    }else{res.redirect('/')}
});

app.get('/signed_in', function(req, res){
   var uid =  req.getAuthDetails().user.user_id;
   var userdata = JSON.stringify(req.getAuthDetails());
   //console.dir(req.getAuthDetails());
   db.sismember('users', uid, function(err, data){
       if(!data){
           db.sismember('invitees', req.getAuthDetails().user.username, function(err, data){
               if(!data){
                   req.logout();
                   res.send('not allowed', 403)
               } else {
                   db.sadd('users', uid);
                   db.set('user:' + uid, userdata, function(err, data){});
                   res.send("new user, first login", 200);
               }
           });
       } else {
         db.set('user:' + uid, userdata, function(err, data){});
         res.send('OK', 200)}
   });
});

app.get('/case/:id/:page/edit', function(req, res) {
    if (req.isAuthenticated()) {
        db.hgetall("case:" + req.params.id + ":page:" + req.params.page, function(err, data) {
            console.dir(data);
            if (!data) {
                return res.send("NOT FOUND", 404);
            }
            else db.sismember('case:' + req.params.id + ':users',
                req.getAuthDetails().user.user_id,
                function(err, editor){
                //console.dir(editor);
                if(editor){
                //console.dir("user allowed")
                //console.dir(JSON.parse(data.toString()).users);
                res.render('edit', {
                    title: "edit",
                    caseid: req.params.id,
                    page: req.params.page,
                    signed_in: req.isAuthenticated(),
                    user: req.getAuthDetails().user.username
                });
                }
                else {res.send("NOT ALLOWED", 403)}
            });
        });
    } else{res.redirect('/')}
});

app.post('/case/:id/newpage', function(req, res){
  console.log('newpage triggered');
  db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor){
    if(editor){
        var page = 2;
        var cid = req.params.id;
        var pagedata = req.body;
        pagedata.texts = 'Double click to add text';
        pagedata.creator = req.getAuthDetails().user.username;
        pagedata.cid = req.params.id;
        requestHandlers.newpage(req, res, cid, page, db, pagedata);
    }
    else{res.send('FORBIDDEN', 403)};
  });
});

app.put('/case/:id/:page', function(req, res) {
    db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor){
        if(editor){
            var data = req.body;
            //console.dir(data);
            data.cid = req.params.id;
            data.creator = req.getAuthDetails().user.username;
            //hash = JSON.stringify(data);
            //console.dir(hash);
            db.hmset('case:' + req.params.id + ':page:' + req.params.page, data);
            console.log('saved page');
            res.send('OK', 200)
        }
        else{res.send('FORBIDDEN', 403)};
    });
});

app.post('/case/:id/:page/delete', function(req, res){
    console.dir('delete page triggered');
    db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor){
        if(editor){
            db.del('case:' + req.params.id + ':page:' + req.params.page);
            res.send('OK', 200);
        }else{res.send('FORBIDDEN', 403)}
    })
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
      title: "README",
      signed_in: req.isAuthenticated(),
      user: username()
   });
});

app.get('/colophon', function(req, res){
   var username = function(){
     if(req.isAuthenticated()){return req.getAuthDetails().user.username}
     else {return "0"}};
   res.render('colophon',{
      title: 'Colophon',
      signed_in: req.isAuthenticated(),
      user: username()
   });
});

app.get('/about', function(req, res){
   var username = function(){
     if(req.isAuthenticated()){return req.getAuthDetails().user.username}
     else {return "0"}};
   res.render('about',{
      title: "About",
      signed_in: req.isAuthenticated(),
      user: username()
   });
});

app.get('/img/:id', function(req, res) {
    if(req.isAuthenticated()){
    var image = __dirname + '/img/' + req.params.id;
    fs.readFile(image, "binary", function(error, file) {
        if (error){ return res.send("huh?", 404);} else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/jpeg');
            res.write(file, "binary");
            res.end();
        }
    });
    }else{res.redirect('/')}
});

app.post('/case/:id/feedback', function(req, res){
    feedback = req.body;
    console.dir(feedback);
    res.send('OK', 200);
});

app.post('/image/:id/:page', function(req, res) {
    console.log("POST /image/ called");
    if(req.isAuthenticated()){
        requestHandlers.postImage2(req,res, db);
    }
    else {res.send("not logged in", 200)}
});

var port = process.env.PORT || 3000;

app.listen(port, function(){
    //console.dir(process.env);
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
