(function() {
  var app, db, easyoauth, exec, express, formidable, fs, loadUser, port, redis, requestHandlers, spawn, sys, url, username, util;

  username = function(req, res) {
    if (req.isAuthenticated()) {
      return req.getAuthDetails().user.username;
    } else {
      return "0";
    }
  };

  loadUser = function(req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect("back");
    } else {
      return next();
    }
  };

  express = require("express");

  formidable = require("formidable");

  exec = require("child_process").exec;

  spawn = require("child_process").spawn;

  url = require("url");

  fs = require("fs");

  requestHandlers = require("./requestHandlers");

  sys = require("sys");

  util = require("util");

  redis = require("redis");

  db = redis.createClient();

  easyoauth = require("easy-oauth");

  app = module.exports = express.createServer();

  app.configure(function() {
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({
      secret: "eventuallycloseduringnative"
    }));
    app.use(require("stylus").middleware({
      src: __dirname + "/public"
    }));
    app.use(easyoauth(require("./keys_file")));
    app.use(app.router);
    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    return app.use(express.static(__dirname + "/public"));
  });

  delete express.bodyParser.parse['multipart/form-data'];

  app.configure("development", function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });

  app.configure("production", function() {
    return app.use(express.errorHandler());
  });

  app.error(function(err, req, res, next) {
    sys.puts("APP.ERROR:" + sys.inspect(err));
    return next(err);
  });

  db.on("error", function(err) {
    return console.log("Redis Error " + err);
  });

  app.get("/", function(req, res) {
    return res.render("index", {
      title: "Home",
      signed_in: req.isAuthenticated(),
      user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0")
    });
  });

  app.get("/signed_in", function(req, res) {
    var uid, userdata;
    uid = req.getAuthDetails().user.user_id;
    userdata = req.getAuthDetails();
    userdata.user_id = userdata.user.user_id;
    userdata.username = userdata.user.username;
    return db.sismember("users", uid, function(err, registered) {
      if (registered) {
        db.hmset("user:" + uid, userdata, function(err, data) {});
        return res.send("OK", 200);
      } else {
        return db.sismember("invitees", req.getAuthDetails().user.username, function(err, invited) {
          if (invited) {
            db.sadd("users", uid);
            db.hmset("user:" + uid, userdata, function(err, data) {});
            return res.send("new user, first login", 200);
          } else {
            req.logout();
            return res.send("not allowed", 403);
          }
        });
      }
    });
  });

  app.get("/sign_out", function(req, res) {
    req.logout();
    return res.send("<button id=\"twitbutt\">Sign in with twitter</button>");
  });

  app.get("/stat/:pagename", function(req, res) {
    return res.render(req.params.pagename, {
      title: req.params.pagename,
      signed_in: req.isAuthenticated(),
      user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0")
    });
  });

  app.get("/newcase", function(req, res) {
    if (!req.isAuthenticated()) return res.redirect("/");
    return res.render("newcase", {
      title: "Create new case",
      signed_in: req.isAuthenticated(),
      user: req.getAuthDetails().user.username
    });
  });

  app.post("/newcase", function(req, res) {
    var data;
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
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
          console.log("created case: " + cid);
          return res.send("/case/" + cid + "/1", 200);
        });
      });
    });
  });

  app.get("/cases/:start/:finish", function(req, res) {
    var end, start;
    if (!req.isAuthenticated()) return res.redirect("back");
    start = parseInt(req.params.start, 10);
    end = parseInt(req.params.finish, 10);
    return db.zrange("listed", start, end, function(err, cases) {
      var sendcases;
      if (err || !cases[0]) res.send(444);
      sendcases = [];
      return cases.forEach(function(theCase, iteration) {
        return db.get("case:" + theCase + ":firstpage", function(err, firstpage) {
          return db.hgetall("case:" + theCase + ":page:" + firstpage, function(err, sendcase) {
            sendcases[iteration] = sendcase;
            if (!cases[iteration + 1]) {
              console.log("rendering cases");
              return res.render("cases", {
                title: "Cases",
                signed_in: req.isAuthenticated(),
                user: req.getAuthDetails().user.username,
                cases: sendcases
              });
            }
          });
        });
      });
    });
  });

  app.get("/case/:id/:page", function(req, res) {
    if (!req.isAuthenticated()) return res.redirect("back");
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      return db.hgetall("case:" + req.params.id + ":page:" + req.params.page, function(error, theCase) {
        if (error || !theCase.cid) return res.redirect("back");
        console.log("rendering case");
        return requestHandlers.rendercase(req, res, theCase, editor, db);
      });
    });
  });

  app.get("/case/:id/:page/feedback", function(req, res) {
    if (!req.isAuthenticated()) return res.send(444);
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

  app.post("/case/:id/:page/newpage", function(req, res) {
    console.log("newpage triggered");
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

  app["delete"]("/case/:id", function(req, res) {
    console.log("DELETE /case/" + req.params.id + " called");
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, owner) {
      if (owner) return requestHandlers.deleteCase(req, res);
    });
  });

  app["delete"]("/sys/deletedcases", function(req, res) {
    console.log("DELETE CASES, CLEANUP CALLED");
    if (req.getAuthDetails().user.username !== 'radioca1se') {
      return res.send("FORBIDDEN", 403);
    }
    if (req.getAuthDetails().user.username === 'radioca1se') {
      return requestHandlers.cleanupCases(req, res);
    }
  });

  app.get("/sys/admin", function(req, res) {
    console.log("ADMINPAGE CALLED");
    if (req.getAuthDetails().user.username !== 'radioca1se') {
      return res.send("FORBIDDEN", 403);
    }
    if (req.getAuthDetails().user.username === 'radioca1se') {
      console.log("rendering adminpage");
      return res.render("admin", {
        title: "ADMINPAGE",
        signed_in: req.isAuthenticated(),
        user: req.getAuthDetails().user.username
      });
    }
  });

  app["delete"]("/case/:id/:page", function(req, res) {
    if (!req.isAuthenticated()) return res.send("FORBIDDEN", 403);
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) {
        console.log("editor");
        requestHandlers.deletePage(req.params.id, req.params.page);
        return res.send("OK", 200);
      }
    });
  });

  app["delete"]("/case/:id/:page/:radio", function(req, res) {
    return db.sismember("case:" + req.params.id + ":users", req.getAuthDetails().user.user_id, function(err, editor) {
      if (editor) {
        db.del("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + req.params.radio + ":caption");
        db.lrem("case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, req.params.radio);
        db.del("radio:" + req.params.radio);
        db.lpush("removedRadios", req.params.radio);
        return res.send("OK", 200);
      }
    });
  });

  app.get("/radio/:id", function(req, res) {
    var radio;
    if (!req.isAuthenticated()) return res.redirect("/");
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

  app.get("/img/:img", function(req, res) {
    var image;
    if (!req.isAuthenticated()) return res.send(444);
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
    console.log("POST /image/ called");
    if (!req.isAuthenticated()) return res.send(444);
    return requestHandlers.postImage2(req, res, db);
  });

  port = process.env.PORT || 3000;

  app.listen(port, function() {
    return console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
  });

}).call(this);
