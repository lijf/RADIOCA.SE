/**
 * Module dependencies.
 */

var express = require('express');
var formidable = require('formidable');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var url = require('url');
var fs = require('fs');
var requestHandlers = require("./requestHandlers");
var sys = require('sys');
//var form = require('connect-form'),
var util = require('util');
var redis = require('redis');
var db = redis.createClient();
var easyoauth = require('easy-oauth');


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
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.static(__dirname + '/public'));
});


app.configure('development', function() {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

app.error(function(err, req, res, next) {
  sys.puts('APP.ERROR:' + sys.inspect(err));
  next(err);
});


// Data Store

db.on('error', function(err) {
  console.log('Redis Error ' + err);
});

// Helper functions

function username(req, res) {
  return req.isAuthenticated() ? req.getAuthDetails().user.username : '0';
}

// Routes

app.get('/', function(req, res) {
  res.render('index', {
    title: 'Home',
    signed_in: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.getAuthDetails().user.username : '0'
  });
});

app.get('/newcase', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else res.render('newcase', {
    title: 'Create new case',
    signed_in: req.isAuthenticated(),
    user: req.getAuthDetails().user.username
  });
});

app.post('/newcase', function(req, res) {
  if (!req.isAuthenticated()) return res.send('FORBIDDEN', 403);
  else {
    var data = req.body;
    data.creator = req.getAuthDetails().user.username;
    console.log(data);
    data.texts = ['Double click to add text'];
    data.created = new Date().getTime();
    data.lastEdit = data.created;
    db.incr('numberOfCases', function(err, cid) {
      data.cid = cid;
      db.incr('case:' + cid + ':pages');
//      db.sadd('case:' + cid + ':page:1:radios', '');
      if (data.private === 'false') {
        db.zadd('casesLastEdit', data.lastEdit, cid);
        db.zadd('cases', data.created, cid);
      }
      db.zadd('cases:' + data.creator, data.created, cid);
      db.hmset('case:' + cid + ':page:1', data, function(err, data) {
        db.sadd('case:' + cid + ':users', req.getAuthDetails().user.user_id, function(err, data) {
          console.log('created case: ' + cid);
          res.send('/case/' + cid + '/1', 200);
        });
      });
    });
  }
});

app.get('/cases/:start/:finish', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else {
    var start = parseInt(req.params.start, 10);
    var end = parseInt(req.params.finish, 10);
    db.zrange('cases', start, end, function(err, cases) {
      if (err || !cases[0]) res.send('404', 404);
      var sendcases = [];
      cases.forEach(function(theCase, iteration) {
        db.hgetall('case:' + theCase + ':page:1', function(err, sendcase) {
          sendcases[iteration] = sendcase;
          if (!cases[iteration + 1]) {
            console.log('rendering cases');
            res.render('cases', {
              title: 'Cases',
              signed_in: req.isAuthenticated(),
              user: req.getAuthDetails().user.username,
              cases: sendcases
            });
          }
        });
      });
    });
  }
});

app.get('/case/:id/:page', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else {
    db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
      db.hgetall('case:' + req.params.id + ':page:' + req.params.page, function(err, theCase) {
        if (err || !theCase.cid) return res.redirect('back');
        if (theCase.private === 'false' || (theCase.private === 'true' && editor)) {
          console.log('rendering case');
          requestHandlers.rendercase(req, res, theCase, editor, db);
        }
        else return res.redirect('back');
      });
    });
  }
});

app.get('/signed_in', function(req, res) {
  var uid = req.getAuthDetails().user.user_id;
  var userdata = req.getAuthDetails();
  userdata.user_id = userdata.user.user_id;
  userdata.username = userdata.user.username;
  //var userdata = JSON.stringify(req.getAuthDetails());
  //console.dir(req.getAuthDetails());
  db.sismember('users', uid, function(err, registered) {
    if (registered) {
      db.hmset('user:' + uid, userdata, function(err, data) {});
      res.send('OK', 200);
    }
    else {
      db.sismember('invitees', req.getAuthDetails().user.username, function(err, invited) {
        if (invited) {
          db.sadd('users', uid);
          db.hmset('user:' + uid, userdata, function(err, data) {});
          res.send('new user, first login', 200);
        }
        else {
          req.logout();
          res.send('not allowed', 403)
        }
      });
    }
  });
});

app.get('/case/:id/:page/edit', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else {
    db.hgetall('case:' + req.params.id + ':page:' + req.params.page, function(err, data) {
      //console.dir(data);
      if (!data) return res.send('NOT FOUND', 404);
      db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
        if (!editor) return res.send('NOT ALLOWED', 403);
        else {
          res.render('edit', {
            title: 'edit',
            caseid: req.params.id,
            page: req.params.page,
            signed_in: req.isAuthenticated(),
            user: req.getAuthDetails().user.username
          });
        }
      });
    });
  }
});

//TODO think about how pages within a case are stored and ordered.

app.post('/case/:id/newpage', function(req, res) {
  console.log('newpage triggered');
  db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
    if (!editor) res.send('FORBIDDEN', 403);
    else {
      var page = 2;
      var cid = req.params.id;
      var pagedata = req.body;
      pagedata.texts = 'Double click to add text';
      pagedata.creator = req.getAuthDetails().user.username;
      pagedata.cid = req.params.id;
      db.incr('case:' + cid + ':pages');
      requestHandlers.newpage(req, res, cid, page, db, pagedata);
    }
  });
});

app.put('/case/:id/:page', function(req, res) {
  db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
    if (!editor) return res.send('FORBIDDEN', 403);
    else {
      var data = req.body;
      data.cid = req.params.id;
      data.lastEdit = new Date().getTime();
      data.creator = req.getAuthDetails().user.username;
      db.zadd('casesLastEdit', data.lastEdit, cid);
      if (!data.private()) db.zadd('cases', data.created, data.cid);
      else db.zrem('cases', data.cid);
      db.hmset('case:' + req.params.id + ':page:' + req.params.page, data);
      console.log('saved page');
      res.send('OK', 200);
    }
  });
});

app.post('/case/:id/:page/delete', function(req, res) {
  console.dir('delete page triggered');
  db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
    if (!editor) res.send('FORBIDDEN', 403);
    else {
      db.del('case:' + req.params.id + ':page:' + req.params.page);
      db.decr('case:' + req.params.id + ':pages', function(err, pages) {
        if (!pages) {
          db.zrem('cases:' + req.getAuthDetails().user.username, req.params.id);
          db.zrem('cases', req.params.id);
        }

      });
      res.send('OK', 200);
    }
  })
});

app.get('/sign_out', function(req, res) {
  req.logout();
  res.send('<button id="twitbutt">Sign in with twitter</button>');
});

app.get('/readme', function(req, res) {
  res.render('readme', {
    title: 'README',
    signed_in: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.getAuthDetails().user.username : '0'
  });
});

app.get('/colophon', function(req, res) {
  res.render('colophon', {
    title: 'Colophon',
    signed_in: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.getAuthDetails().user.username : '0'
  });
});

app.get('/about', function(req, res) {
  res.render('about', {
    title: 'About',
    signed_in: req.isAuthenticated(),
    user: req.isAuthenticated() ? req.getAuthDetails().user.username : '0'
  });
});

app.delete('/case/:id/:page/:radio', function(req, res) {
  db.sismember('case:' + req.params.id + ':users', req.getAuthDetails().user.user_id, function(err, editor) {
    if (!editor) res.send('FORBIDDEN', 403);
    else {
      db.del('case:' + req.params.id + ':page:' + req.params.page + ':radio:' + req.params.radio + ':caption');
      db.lrem('case:' + req.params.id + ':page:' + req.params.page + ':radios', 0, req.params.radio);
      db.srem('image:' + req.params.radio, req.params.id);
      res.send('OK', 200);
    }
  });
});

app.get('/radios/:user', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  if (!req.getAuthDetails().user.username === req.params.user) return res.redirect('back');
  else {
    sendradios = [];
    db.lrange('user:' + req.params.user + ':radios', 0, -1, function(err, radios) {
      radios.forEach(function(radio, id) {
        console.log(radio);
        sendradios[id] = {};
        sendradios[id].ID = radio;
        db.lrange("radio:" + radio, 0, -1, function(err, images) {
          sendradios[id].images = [];
          images.forEach(function(image, imgID) {
            sendradios[id].images[imgID] = image;
          });
          if (!radios[id + 1]) {
            console.dir(sendradios);
            return res.render('userradios', {
              title: 'Radios - ' + req.params.user,
              user: req.getAuthDetails().user.username,
              signed_in: req.isAuthenticated(),
              radios: sendradios
            });
          }
        });
      });
    });
  }
});

app.get('/radio/:id', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else {
    var radio = {};
    radio.ID = req.params.id;
    db.lrange("radio:" + req.params.id, 0, -1, function(err, images) {
      radio.images = [];
      images.forEach(function(image, imgID) {
        radio.images[imgID] = image;
      });
      res.partial('radio', {object: radio});
    });
  }
});

app.get('/img/:img', function(req, res) {
  if (!req.isAuthenticated()) return res.redirect('/');
  else {
    var image = __dirname + '/img/' + req.params.img;
    fs.readFile(image, 'binary', function(error, file) {
      if (error) return res.send('huh?', 404);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'image/jpeg');
      res.write(file, 'binary');
      res.end();
    });
  }
});

app.post('/case/:id/feedback', function(req, res) {
  var feedback = req.body;
  console.dir(feedback);
  res.send('OK', 200);
});

app.post('/image/:id/:page', function(req, res) {
  console.log('POST /image/ called');
  if (!req.isAuthenticated()) res.send('not logged in', 200);
  else requestHandlers.postImage2(req, res, db);
});

var port = process.env.PORT || 3000;

app.listen(port, function() {
  //console.dir(process.env);
  console.log('Express server listening on port %d in %s mode', app.address().port, app.settings.env);
});

//var time = new Date().getTime();
