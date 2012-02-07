(function() {
  var db, deleteCase, deleteCase2, deleteCase3, deletePage, form, formidable, newpage, postImage, postImage2, postNewpage, putPage, redis, removeRadio, render, rendercase, url;

  formidable = require("formidable");

  url = require("url");

  form = require("connect-form");

  redis = require("redis");

  db = redis.createClient();

  render = function(req, res, theCase, editor) {
    return res.render(theCase.pagetype, {
      title: theCase.title || " - untitled",
      radios: theCase.radios || "",
      texts: [theCase.texts] || "",
      creator: theCase.creator || "",
      created: theCase.created,
      mdhelp: theCase.mdhelp,
      signed_in: req.isAuthenticated(),
      user: req.getAuthDetails().user.username,
      cid: req.params.id,
      prevpage: theCase.prevpage,
      nextpage: theCase.nextpage,
      page: req.params.page,
      editor: editor,
      private: theCase.private || 0,
      feedback: theCase.feedback || '',
      style: theCase.style
    });
  };

  rendercase = function(req, res, theCase, editor) {
    return db.get("markdown-help", function(err, data) {
      theCase.mdhelp = JSON.parse(data);
      return db.lrange("case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, -1, function(err, radioIDs) {
        if (radioIDs.length < 1) return render(req, res, theCase, editor);
        theCase.radios = [];
        return radioIDs.forEach(function(radioID, ID) {
          return db.get("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + radioID + ":caption", function(err, caption) {
            theCase.radios[ID] = [];
            theCase.radios[ID].ID = radioID;
            if (caption) theCase.radios[ID].caption = caption;
            return db.lrange("radio:" + radioID, 0, -1, function(err, images) {
              theCase.radios[ID].images = [];
              images.forEach(function(image, imgID) {
                return theCase.radios[ID].images[imgID] = image;
              });
              theCase.feedback = [];
              return db.lrange("case:" + req.params.id + ":page:" + req.params.page + ":feedback", 0, -1, function(err, feedback) {
                feedback.forEach(function(fb, fbID) {
                  return theCase.feedback[fbID] = fb;
                });
                if (!radioIDs[ID + 1]) return render(req, res, theCase, editor);
              });
            });
          });
        });
      });
    });
  };

  postImage = function(req, res, db) {
    return req.form.on("progress", function(bytesReceived, bytesExpected) {
      var percent;
      percent = (bytexReceived / bytesExpected * 100) || 0;
      return console.log("Uploading: %" + percent + "\r");
    });
  };

  removeRadio = function(req, res, cid, page, radio) {
    db.del("case:" + cid + ":page:" + page + ":radio:" + radio + ":caption");
    db.lrem("case:" + cid + ":page:" + page + ":radios", 0, radio);
    db.srem("image:" + radio, cid);
    return res.send("OK", 200);
  };

  postImage2 = function(req, res, db) {
    var d, fields, files, i;
    d = new Date().getTime().toString();
    i = 0;
    form = new formidable.IncomingForm();
    files = [];
    fields = [];
    form.on("field", function(field, value) {
      return fields.push([field, value]);
    }).on("fileBegin", function(field, file) {
      if (file.type = "image/jpeg") {
        file.path = __dirname + "/img/" + d + "." + i + ".jpg";
        db.rpush("radio:" + d, "/img/" + d + "." + i + ".jpg");
        i++;
      }
      return files.push([field, file]);
    }).on("end", function() {
      db.sadd("image:" + d, req.params.id);
      db.sadd("radio:" + d + ":users", req.getAuthDetails().user_id);
      db.rpush("case:" + req.params.id + ":page:" + req.params.page + ":radios", d);
      db.rpush("user:" + req.getAuthDetails().user.username + ":radios", d);
      db.set("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "edit caption");
      res.send(d, 200);
      return console.log("-> upload done");
    });
    return form.parse(req, function(err, fields, files) {
      if (err) return console.log(err);
    });
  };

  deletePage = function(cid, page) {
    db.lrange("case:" + cid + ":page:" + page + ":radios", 0, -1, function(err, radioIDs) {
      var radioID, _i, _len, _results;
      if (!err) {
        _results = [];
        for (_i = 0, _len = radioIDs.length; _i < _len; _i++) {
          radioID = radioIDs[_i];
          _results.push(removeRadio(cid, page, radioID));
        }
        return _results;
      }
    });
    return db.hgetall("case:" + cid + ":page:" + page, function(err, thePage) {
      if (!err) {
        if (thePage.prevpage === "0") {
          db.set("case:" + cid + ":firstpage", thePage.nextpage);
        }
        db.hset("case:" + cid + ":page:" + thePage.prevpage, "nextpage", thePage.nextpage);
        db.hset("case:" + cid + ":page:" + thePage.nextpage, "prevpage", thePage.prevpage);
        return db.del("case:" + cid + ":page:" + page);
      }
    });
  };

  putPage = function(req, res) {
    var data;
    data = req.body;
    console.dir(data);
    data.cid = req.params.id;
    data.lastEdit = new Date().getTime();
    data.creator = req.getAuthDetails().user.username;
    db.zadd("casesLastEdit", data.lastEdit, data.cid);
    if (data.private === "false") {
      db.zadd("cases", data.created, data.cid);
    } else {
      db.zrem("cases", data.cid);
    }
    db.hmset("case:" + req.params.id + ":page:" + req.params.page, data);
    if (data.radios) {
      data.radios.forEach(function(r, rID) {
        return db.set("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + r.id + ":caption", r.caption);
      });
    }
    console.log("saved page");
    return res.send("OK", 200);
  };

  postNewpage = function(req, res) {
    var cid, pagedata;
    cid = req.params.id;
    pagedata = req.body;
    pagedata.texts = "Edit text";
    pagedata.creator = req.getAuthDetails().user.username;
    pagedata.cid = req.params.id;
    return db.incr("case:" + cid + ":pages", function(err, page) {
      var prevpage;
      prevpage = req.params.page;
      return db.hget("case:" + cid + ":page:" + prevpage, "nextpage", function(err, nextpage) {
        pagedata.prevpage = prevpage;
        pagedata.nextpage = nextpage;
        db.hmset("case:" + cid + ":page:" + page, pagedata);
        db.hset("case:" + cid + ":page:" + prevpage, "nextpage", page);
        db.hset("case:" + cid + ":page:" + nextpage, "prevpage", page);
        return res.send("/case/" + cid + "/" + page, 200);
      });
    });
  };

  newpage = function(req, res, cid, page, db, pagedata) {
    var trypage;
    trypage = "case:" + cid + ":page:" + page;
    return db.get(trypage, function(err, data) {
      if (data) {
        page++;
        return newpage(req, res, cid, page, db, pagedata);
      } else {
        db.hmset(trypage, pagedata);
        return res.send("/case/" + cid + "/" + page, 200);
      }
    });
  };

  deleteCase = function(req, res) {
    var cid;
    cid = req.params.id;
    console.log("deleteCase called");
    db.zrem("listed", cid);
    db.rpush("deletedCases", cid);
    return res.send("OK, deleted", 200);
  };

  deleteCase3 = function(req, res) {
    var cid;
    cid = req.params.id;
    console.log("deleteCase called");
    return db.get("case:" + cid + ":pages", function(err, pages) {
      var page;
      if (!err) {
        console.log("deleting " + pages + " pages");
        db.lrange("case:" + cid + ":page:" + page + ":radios", 0, -1, function(err, radioIDs) {
          var radioID, _i, _len, _results;
          if (!err) {
            _results = [];
            for (_i = 0, _len = radioIDs.length; _i < _len; _i++) {
              radioID = radioIDs[_i];
              _results.push(removeRadio(cid, page, radioID));
            }
            return _results;
          }
        });
        for (page = 0; 0 <= pages ? page <= pages : page >= pages; 0 <= pages ? page++ : page--) {
          deletePage(cid, page);
        }
        db.zrem("listed", cid);
        db.del("case:" + cid + ":pages");
        db.del("case:" + cid + ":users");
        db.del("case:" + cid + ":firstpage");
        return res.send("OK, deleted " + cid, 200);
      }
    });
  };

  deleteCase2 = function(req, res, delpage) {
    var cid;
    cid = req.params.id;
    return deletePage(cid, delpage, function(nextpage) {
      console.log(nextpage);
      if (nextpage) {
        console.log("in recursive");
        return deleteCase(req, res, nextpage);
      } else {
        db.zrem("listed", cid);
        return res.send(200, "Deleted " + cid);
      }
    });
  };

  exports.deleteCase = deleteCase;

  exports.postNewpage = postNewpage;

  exports.putPage = putPage;

  exports.deletePage = deletePage;

  exports.removeRadio = removeRadio;

  exports.rendercase = rendercase;

  exports.newpage = newpage;

  exports.postImage2 = postImage2;

  exports.postImage = postImage;

}).call(this);
