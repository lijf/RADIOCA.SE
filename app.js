(function() {
  var app, db, easyoauth, exec, express, formidable, fs, http, icd, port, redis, requestHandlers, server, silent, spawn, sys, url, username, util;

  username = function(req, res) {
    if (req.isAuthenticated()) {
      return req.getAuthDetails().user.username;
    } else {
      return "0";
    }
  };

  String.prototype.toProperCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

  express = require("express");

  http = require("http");

  app = module.exports = express();

  silent = 'test' === process.env.NODE_ENV;

  formidable = require("formidable");

  exec = require("child_process").exec;

  spawn = require("child_process").spawn;

  url = require("url");

  fs = require("fs");

  requestHandlers = require("./requestHandlers");

  sys = require("sys");

  util = require("util");

  redis = require("redis");

  db = redis.createClient(process.env.DB_PORT);

  icd = redis.createClient(4444);

  util = require("util");

  easyoauth = require("easy-oauth");

  app.set("views", __dirname + "/views");

  app.set("view engine", "jade");

  app.set("view options", {
    layout: false
  });

  app.use(express.bodyParser());

  app.enable("verbose errors");

  if ("production" === app.settings.env) app.disable("verbose errors");

  app.use(express.methodOverride());

  app.use(express.cookieParser());

  app.use(express.session({
    secret: "eventuallycloseduringnative"
  }));

  app.use(require("stylus").middleware({
    src: __dirname + "/public/"
  }));

  app.use(require("connect-assets")());

  app.use(easyoauth(require("./keys_file")));

  app.use(app.router);

  app.use(express.favicon(__dirname + "/public/favicon.ico"));

  app.use(express.static(__dirname + "/public"));

  app.use(function(req, res, next) {
    res.status(404);
    if (req.accepts("html")) {
      res.render("404", {
        url: req.url
      });
      return;
    }
    if (req.accepts("json")) {
      res.send({
        eror: "Not found"
      });
      return;
    }
    return res.type("txt").send("Not found");
  });

  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    return res.render("500", {
      error: err
    });
  });

  db.on("error", function(err) {
    return console.log("Redis Error " + err);
  });

  app.get("/", function(req, res) {
    if (req.isAuthenticated()) {
      return res.redirect("/cases/0/-1");
    } else {
      return requestHandlers.renderRoot(req, res);
    }
  });

  app.get("/signed_in", function(req, res) {
    var userdata;
    userdata = req.getAuthDetails();
    return db.sismember("users", userdata.user.user_id(function(err, registered) {
      if (registered) {
        db.set("user:" + userdata.user.user_id, JSON.stringify(userdata));
        db.set("user:" + userdata.user.username, userdata.user.user_id);
        return res.send("OK", 200);
      } else {
        db.sadd("users", userdata.user.user_id);
        db.set("user:" + userdata.user.user_id, JSON.stringify(userdata));
        db.set("user:" + userdata.user.username, userdata.user.user_id);
        return res.send("OK, new user", 200);
      }
    }));
  });

  app.get("/sign_out", function(req, res) {
    req.logout();
    return res.send("OK", 200);
  });

  app.get("/stat/:pagename", function(req, res) {
    return res.render(req.params.pagename, {
      title: req.params.pagename,
      signed_in: req.isAuthenticated(),
      user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0"),
      icds: ""
    });
  });

  app.post("/newcase", function(req, res) {
    return db.sismember("userCanAdd", req.getAuthDetails().user.user_id, function(err, canAdd) {
      var data;
      if (!canAdd) return res.send("FORBIDDEN", 403);
      if (canAdd) {
        data = req.body;
        data.creator = req.getAuthDetails().user.username;
        data.texts = [""];
        data.created = new Date().getTime();
        data.lastEdit = data.created;
        data.listed = "true";
        data.nextpage = "0";
        data.prevpage = "0";
        return db.incr("numberOfCases", function(err, cid) {
          data.cid = cid;
          db.incr("case:" + cid + ":pages");
          db.zadd("casesLastEdit", data.lastEdit, cid);
          if (data.listed === "true") db.zadd("listed", data.created, cid);
          db.zadd("cases:" + data.creator, data.created, cid);
          db.set("case:" + cid + ":firstpage", "1");
          return db.hmset("case:" + cid + ":page:1", data, function(err, data) {
            return db.sadd("case:" + cid + ":users", req.getAuthDetails().user.user_id, function(err, data) {
              return res.send("/case/" + cid + "/1", 200);
            });
          });
        });
      }
    });
  });

  app.post("/icd", function(req, res) {
    var body;
    body = req.body.qs;
    body = '*' + body + '*';
    return icd.keys(body, function(err, codes) {
      if (!err) {
        codes = JSON.stringify(codes, null, '\t');
        if (codes.length < 10000) {
          return res.send(codes, 200);
        } else {
          return res.send(444);
        }
      }
    });
  });

  app.get("/cases/:start/:finish", function(req, res) {
    var end, start;
    start = parseInt(req.params.start, 10);
    end = parseInt(req.params.finish, 10);
    return requestHandlers.rendercases(req, res, start, end);
  });

  app.get("/case/:id/:page", function(req, res) {
    var userid;
    if (req.isAuthenticated()) {
      userid = req.getAuthDetails().user.user_id;
    } else {
      userid = '0';
    }
    return db.sismember("case:" + req.params.id + ":users", userid, function(err, editor) {
      return db.hgetall("case:" + req.params.id + ":page:" + req.params.page, function(error, theCase) {
        if (error || !theCase) return res.redirect("back");
        return requestHandlers.rendercase(req, res, theCase, editor);
      });
    });
  });

  app.get("/case/:id/:page/feedback", function(req, res) {
    return db.lrange("case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, function(err, feedback) {
      var pagefeedback;
      pagefeedback = [];
      feedback.forEach(function(fb, fbID) {
        return pagefeedback[fbID] = JSON.parse(fb);
      });
      return res.partial("feedback", {
        object: pagefeedback
      });
    });
  });

  app.post("/completed/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
    db.sadd("completed:" + req.getAuthDetails().user_id, req.params.id);
    return db.sadd("case:" + req.params.id + ":completed", req.getAuthDetails().user_id);
  });

  app.post("/rmcompleted/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
    db.srem("completed:" + req.getAuthDetails().user_id, req.params.id);
    return db.srem("case:" + req.params.id + ":completed", req.getAuthDetails().user_id);
  });

  app.post("/bookmark/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
    db.sadd("bookmarks:" + req.getAuthDetails().user_id, req.params.id);
    db.sadd("case:" + req.params.id + ":bookmarked", req.getAuthDetails().user_id);
    return res.send(200);
  });

  app.post("/rmbookmark/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
    db.srem("bookmarks:" + req.getAuthDetails().user_id, req.params.id);
    db.srem("case:" + req.params.id + ":bookmarked", req.getAuthDetails().user_id);
    return res.send(200);
  });

  app.post("/case/:id/:page/newpage", function(req, res) {
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) return requestHandlers.postNewpage(req, res);
    });
  });

  app.post("/case/:id/:page/feedback", function(req, res) {
    var fb, storefeedback;
    if (!req.isAuthenticated()) return res.send(444);
    storefeedback = {};
    storefeedback.feedback = req.body.feedback;
    storefeedback.uid = req.getAuthDetails().user.user_id;
    storefeedback.user = req.getAuthDetails().user.username;
    storefeedback.time = new Date().toString();
    fb = JSON.stringify(storefeedback);
    db.rpush("case:" + req.params.id + ":page:" + req.params.page + ":feedback", fb, function(err) {
      if (err) return console.log(err);
    });
    return res.send("OK", 200);
  });

  app.put("/case/:id/:page", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) return requestHandlers.putPage(req, res);
    });
  });

  app.post("/hide/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, owner) {
      if (owner || req.getAuthDetails().user.username === 'radioca1se') {
        return db.hset("case:" + req.params.id, "hidden", true, function(err) {
          if (err) {
            return console.log(err);
          } else {
            return res.send("OK", 200);
          }
        });
      }
    });
  });

  app.post("/show/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, owner) {
      if (owner || req.getAuthDetails().user.username === 'radioca1se') {
        return db.hset("case:" + req.params.id, "hidden", false, function(err) {
          if (err) {
            return console.log(err);
          } else {
            return res.send("OK", 200);
          }
        });
      }
    });
  });

  app["delete"]("/case/:id", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, owner) {
      if (owner) return requestHandlers.deleteCase(req, res);
    });
  });

  app["delete"]("/sys/deletedcases", function(req, res) {
    if (req.getAuthDetails().user.username !== 'radioca1se') {
      return res.send("FORBIDDEN", 403);
    }
    if (req.getAuthDetails().user.username === 'radioca1se') {
      return requestHandlers.cleanupCases(req, res);
    }
  });

  app.get("/sys/admin", function(req, res) {
    if (req.getAuthDetails().user.username !== 'radioca1se') {
      return res.send("FORBIDDEN", 403);
    }
    if (req.getAuthDetails().user.username === 'radioca1se') {
      return res.render("admin", {
        title: "ADMINPAGE",
        signed_in: req.isAuthenticated(),
        user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0"),
        icds: ""
      });
    }
  });

  app["delete"]("/case/:id/:page", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) {
        requestHandlers.deletePage(req.params.id, req.params.page);
        return res.send("OK", 200);
      }
    });
  });

  app["delete"]("/case/:id/:page/:radio", function(req, res) {
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) {
        requestHandlers.removeRadio2(req.params.id, req.params.page, req.params.radio);
        return res.send("OK", 200);
      }
    });
  });

  app.get("/radio/:id", function(req, res) {
    var radio;
    radio = {};
    radio.ID = req.params.id;
    return db.lrange("radio:" + req.params.id, 0, -1, function(err, images) {
      radio.images = [];
      images.forEach(function(image, imgID) {
        return radio.images[imgID] = image;
      });
      return res.partial("radio", {
        object: radio
      });
    });
  });

  app.get("/dicom/:dicom", function(req, res) {
    var dicom;
    dicom = __dirname + "/dicom/" + req.params.dicom;
    return fs.readFile(dicom, "binary", function(err, file) {
      if (err) return res.send(444);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/osirixzip");
      res.write(file, "binary");
      return res.end();
    });
  });

  app.get("/img/:img", function(req, res) {
    var image;
    image = __dirname + "/img/" + req.params.img;
    return fs.readFile(image, "binary", function(err, file) {
      if (err) return res.send(444);
      res.statusCode = 200;
      res.setHeader("Content-Type", "image/jpeg");
      res.write(file, "binary");
      return res.end();
    });
  });

  app.post("/image/:id/:page", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
    return requestHandlers.postImage2(req, res, db);
  });

  console.log(JSON.stringify(process.env));

  port = process.env.PORT;

  if (!module.parent) {
    server = http.createServer(app).listen(port);
    silent || console.log("Express server listening on port %d in %s mode", server.address().port, app.settings.env);
  }

}).call(this);
