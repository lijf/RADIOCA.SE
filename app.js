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
            else{db.sadd('private', cid)};
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
    else{res.send('FORBIDDEN', 403)};
});

app.post('/newcase_old', function(req, res){
   if(req.isAuthenticated()){
      var data = req.body;
      data.creator = req.getAuthDetails().user.username;
      //console.log(data);
      data.texts = ['Double click to add text'];
      db.incr('number_of_cases', function(err, casenumber){
        //console.dir(data);
        //console.log(data.meta_private);
        data.cid = casenumber.toString();
        casedata=JSON.stringify(data);
        var caseurl = 'case:' + casenumber;
        //console.log(data.private);
        if(!data.private){ db.lpush('cases', casedata)}
        else{db.sadd('private', caseurl)};
        db.sadd('cases:' + data.creator, casedata);
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
    if(req.isAuthenticated()){
        var start = parseInt(req.params.start, 10);
        var end = parseInt(req.params.finish, 10);
        db.lrange('cases', start, end, function(err, data){
            if(err){res.send('404', 404)}
            else{
                if(!data[0]){
                    console.dir('not found');
                    res.send('404', 404);
                }else{
                    var i = 0;
                    var sendcases = [];
                    requestHandlers.getCases(req, res, data, i, sendcases, db);
                }
            }
        });
    }else{ res.redirect('/') }
});

app.get('/cases/:start/:finish/old', function(req, res){
 if(req.isAuthenticated()){
   var start = parseInt(req.params.start, 10);
   var end = parseInt(req.params.finish, 10);
   db.lrange('cases', start, end, function(err, data){
       if(err){res.render('404', {layout: false})}
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
              //console.dir(sendcases);
              res.render('cases', {
                   title: 'Cases',
                   signed_in: req.isAuthenticated(),
                   user: req.getAuthDetails().user.username,
                   cases: sendcases
            });
          }
    }
   });
 }else{ res.redirect('/') }
});

//app.get('/case/:id/:page/new', function(req, res){
//    if(req.isAuthenticated()){
//        console.log('GET case/' + req.params.id + '/' + req.params.page);
//        db.sismember('private','case:' + req.params.id, function(err, private){
//            if(err){res.redirect('back');}else{
//            if(!private){requestHandlers.renderpage(req, res, db)}
//            else{
//              db.smembers('case:' + req.params.id + ':users', function(err, editors){
//                  if(include(editors, req.params.getAuthDetails().user.user_id)){
//                      console.log('found in editors');
//                      reqestHandlers.renderpage(req, res, db)
//                  } else {res.send('NOT ALLOWED', 403)}
//              });
//            }}
//        });
//    }});

app.get('/case/:id/:page', function(req, res) {
    if(req.isAuthenticated()){
        console.log('GET case/' + req.params.id + '/' + req.params.page);
        var findCase = "case:" + req.params.id + ":page:" + req.params.page;
        db.sismember('case:' + req.params.id + ':users',
            req.getAuthDetails().user.user_id,
            function(err, editor){
                db.get("markdown-help", function(err, data){
                    mdhelp = JSON.parse(data);
                    db.hgetall(findCase, function(err, theCase){
                    if(err || !theCase.cid){res.redirect('back')} else {
                        console.dir(theCase);
                        var prevpage = parseInt(req.params.page, 10) - 1;
                        var nextpage = parseInt(req.params.page, 10) + 1;
                        if(theCase.meta_private){
                            if(editor){
                                return res.render('case', {
                                    title: theCase.title || ' - untitled',
                                    radios: theCase.radios || '',
                                    texts: [theCase.texts] || '',
                                    creator: theCase.creator || '',
                                    mdhelp: mdhelp,
                                    signed_in: req.isAuthenticated(),
                                    user: req.getAuthDetails().user.username,
                                    cid: req.params.id,
                                    prevpage: prevpage,
                                    nextpage: nextpage,
                                    page: req.params.page,
                                    editor: editor,
                                    meta_private: theCase.meta_private || 0
                                });
                            }else{res.redirect('back');}
                        }else{
                            return res.render('case', {
                                title: theCase.title || ' - untitled',
                                radios: theCase.radios || '',
                                texts: theCase.texts || '',
                                creator: theCase.creator || '',
                                mdhelp: mdhelp,
                                signed_in: req.isAuthenticated(),
                                user: req.getAuthDetails().user.username,
                                cid: req.params.id,
                                prevpage: prevpage,
                                nextpage: nextpage,
                                page: req.params.page,
                                editor: editor,
                                meta_private: theCase.meta_private || 0
                            });
                        }
                    }
                });
            });
        });
    }else{res.redirect('/')}
});

app.get('/case/:id/:page/old', function(req, res) {
  if(req.isAuthenticated()){
    console.log('GET case/' + req.params.id + '/' + req.params.page);
    var findCase = "case:" + req.params.id + ":page:" + req.params.page;
        db.sismember('case:' + req.params.id + ':users',
          req.getAuthDetails().user.user_id,
          function(err, editor){
            db.mget(findCase, "markdown-help", function(err, data){
                //console.dir(data);
                if(!data[0]){res.redirect('back')} else {
                //console.log(data[0]);
                var theCase = JSON.parse(data[0].toString());
                var mdhelp = JSON.parse(data[1].toString());
                var prevpage = parseInt(req.params.page, 10) - 1;
                var nextpage = parseInt(req.params.page, 10) + 1;
                if(theCase.meta_private){
                    if(editor){
                        return res.render('case', {
                            title: theCase.title || ' - untitled',
                            radios: theCase.radios || '',
                            texts: theCase.texts || '',
                            creator: theCase.creator || '',
                            mdhelp: mdhelp,
                            signed_in: req.isAuthenticated(),
                            user: req.getAuthDetails().user.username,
                            cid: req.params.id,
                            prevpage: prevpage,
                            nextpage: nextpage,
                            page: req.params.page,
                            editor: editor,
                            meta_private: theCase.meta_private || 0
                        });
                    }else{res.redirect('back');}
                }else{
                    return res.render('case', {
                        title: theCase.title || ' - untitled',
                        radios: theCase.radios || '',
                        texts: theCase.texts || '',
                        creator: theCase.creator || '',
                        mdhelp: mdhelp,
                        signed_in: req.isAuthenticated(),
                        user: req.getAuthDetails().user.username,
                        cid: req.params.id,
                        prevpage: prevpage,
                        nextpage: nextpage,
                        page: req.params.page,
                        editor: editor,
                        meta_private: theCase.meta_private || 0
                    });
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

app.put('/case/:id/:page/old', function(req, res) {
    db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor){
            if(editor){
                var data = req.body;
                //console.dir(data);
                data.creator = req.getAuthDetails().user.username;
                data.cid = req.params.id;
                db.set('case:' + req.params.id + ':page:' + req.params.page, JSON.stringify(data));
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

app.get('/image/:id', function(req, res) {
    if(req.isAuthenticated()){
    var image = __dirname + '/img/' + req.params.id + '.jpg';
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

app.post('/:id/image/', function(req, res) {
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
