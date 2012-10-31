(function() {
  var cleanupCases, db, deleteCaseID, deletePage, deletePage2, form, formidable, postImage, postImage2, postNewpage, putPage, redis, removeCase, removeRadio2, render, renderRoot, rendercase, rendercases, url;

  formidable = require("formidable");

  url = require("url");

  form = require("connect-form");

  redis = require("redis");

  db = redis.createClient(process.env.DB_PORT);

  renderRoot = function(req, res) {
    return res.render("index", {
      title: "Home",
      signed_in: req.isAuthenticated(),
      user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0"),
      icds: ""
    });
  };

  rendercases = function(req, res, start, end) {
    var userid;
    if (req.isAuthenticated()) {
      userid = req.getAuthDetails().user_id;
    } else {
      userid = "0";
    }
    return db.zrange("listed", start, end, function(err, cases) {
      var sendcases;
      if (err || !cases[0]) return res.send("Error", 444);
      sendcases = [];
      return db.smembers("bookmarks:" + userid, function(err, bookmarks) {
        return db.smembers("completed:" + userid, function(err, completed) {
          return cases.forEach(function(theCase, iteration) {
            return db.get("case:" + theCase + ":firstpage", function(err, firstpage) {
              return db.hgetall("case:" + theCase, function(err, sendcase) {
                if (!sendcase) sendcase = {};
                if (sendcase.icds) sendcase.icds = JSON.parse(sendcase.icds);
                sendcase.cid = theCase;
                sendcase.firstpage = firstpage;
                sendcases[iteration] = sendcase;
                if (!cases[iteration + 1]) {
                  console.dir(sendcases);
                  return res.render("cases", {
                    title: "Cases",
                    signed_in: req.isAuthenticated(),
                    user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0"),
                    cases: sendcases,
                    bookmarks: bookmarks,
                    completed: completed,
                    icds: ""
                  });
                }
              });
            });
          });
        });
      });
    });
  };

  render = function(req, res, theCase, editor) {
    return res.render(theCase.pagetype, {
      title: theCase.title || " - untitled",
      radios: theCase.radios || "",
      texts: theCase.texts || "",
      creator: theCase.creator || "",
      created: theCase.created,
      mdhelp: theCase.mdhelp,
      signed_in: req.isAuthenticated(),
      user: (req.isAuthenticated() ? req.getAuthDetails().user.username : "0"),
      cid: req.params.id,
      modalities: theCase.modalities || "",
      description: theCase.description || "",
      icds: theCase.icds || "",
      language: theCase.language || "",
      prevpage: theCase.prevpage,
      nextpage: theCase.nextpage,
      bookmarked: theCase.bookmarked,
      completed: theCase.completed,
      page: req.params.page,
      pagetype: theCase.pagetype,
      editor: editor,
      private: theCase.private || 0,
      feedback: theCase.feedback || '',
      style: theCase.style
    });
  };

  rendercase = function(req, res, theCase, editor) {
    return db.get("markdown-help", function(err, data) {
      var userid, username;
      if (req.isAuthenticated()) {
        username = req.getAuthDetails().username;
        userid = req.getAuthDetails().user_id;
      } else {
        username = "";
        userid = "0";
      }
      theCase.mdhelp = data;
      if (theCase.texts) theCase.texts = JSON.parse(theCase.texts);
      return db.hgetall("case:" + req.params.id, function(err, casedata) {
        theCase.modalities = casedata.modalities;
        theCase.description = casedata.description;
        theCase.creator = casedata.creator;
        theCase.title = casedata.title;
        if (casedata.hidden === 'true' && !editor && username !== 'radioca1se') {
          res.redirect('/');
        }
        return db.sismember("bookmarks:" + userid, req.params.id, function(err, bookmarked) {
          if (!err) theCase.bookmarked = bookmarked;
          return db.sismember("completed:" + userid, req.params.id, function(err, completed) {
            if (!err) theCase.completed = completed;
            return db.lrange("case:" + req.params.id + ":icds", 0, -1, function(err, ICDCodes) {
              if (!err) {
                delete theCase.icds;
                theCase.icds = [];
                ICDCodes.forEach(function(ICDCode, iID) {
                  return theCase.icds[iID] = ICDCode;
                });
              }
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
                        if (!radioIDs[ID + 1]) {
                          return render(req, res, theCase, editor);
                        }
                      });
                    });
                  });
                });
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
      return percent = (bytexReceived / bytesExpected * 100) || 0;
    });
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
      db.rpush("case:" + req.params.id + ":page:" + req.params.page + ":radios", d);
      db.rpush("user:" + req.getAuthDetails().user.username + ":radios", d);
      db.set("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "edit caption");
      return res.send(d, 200);
    });
    return form.parse(req, function(err, fields, files) {
      if (err) return console.log(err);
    });
  };

  deletePage = function(req, res, cid, page) {
    db.lrange("case:" + cid + ":page:" + page + ":radios", 0, -1, function(err, radioIDs) {
      var radioID, _i, _len, _results;
      if (!err) {
        _results = [];
        for (_i = 0, _len = radioIDs.length; _i < _len; _i++) {
          radioID = radioIDs[_i];
          _results.push(removeRadio2(cid, page, radioID));
        }
        return _results;
      }
    });
    return db.hgetall("case:" + cid + ":page:" + page, function(err, thePage) {
      var redir;
      if (!err) {
        if (thePage.prevpage === "0") {
          db.set("case:" + cid + ":firstpage", thePage.nextpage);
          redir = thePage.nextpage;
        }
        if (thePage.prevpage !== "0") {
          db.hset("case:" + cid + ":page:" + thePage.prevpage, "nextpage", thePage.nextpage);
          redir = thePage.prevpage;
        }
        if (thePage.nextpage !== "0") {
          db.hset("case:" + cid + ":page:" + thePage.nextpage, "prevpage", thePage.prevpage);
        }
        db.del("case:" + cid + ":page:" + page);
        console.log(redir);
        return res.send(redir, 200);
      }
    });
  };

  removeRadio2 = function(cid, page, radio) {
    db.del("case:" + cid + ":page:" + page + ":radio:" + radio + ":caption");
    db.lrem("case:" + cid + ":page:" + page + ":radios", 0, radio);
    return db.lpush("removedRadios", radio);
  };

  deletePage2 = function(cid, page) {
    return db.lrange("case:" + cid + ":page:" + page + ":radios", 0, -1, function(err, radioIDs) {
      var radioID, _i, _len;
      if (!(err || !radioIDs)) {
        for (_i = 0, _len = radioIDs.length; _i < _len; _i++) {
          radioID = radioIDs[_i];
          removeRadio2(cid, page, radioID);
        }
      }
      db.del("case:" + cid + ":page:" + page);
      return db.del("case:" + cid + ":page:" + page + ":radios");
    });
  };

  deleteCaseID = function(cid) {
    db.lrem("removedCases", 0, cid);
    db.zrem("listed", cid);
    return db.get("case:" + cid + ":pages", function(err, pages) {
      var page;
      if (!(err || !pages)) {
        for (page = 0; 0 <= pages ? page <= pages : page >= pages; 0 <= pages ? page++ : page--) {
          deletePage2(cid, page);
        }
        db.del("case:" + cid);
        db.del("case:" + cid + ":pages");
        db.del("case:" + cid + ":users");
        return db.del("case:" + cid + ":firstpage");
      }
    });
  };

  cleanupCases = function(req, res) {
    return db.lrange('removedCases', 0, -1, function(err, caseIDs) {
      var caseID, _i, _len, _results;
      if (!(err || !caseIDs)) {
        _results = [];
        for (_i = 0, _len = caseIDs.length; _i < _len; _i++) {
          caseID = caseIDs[_i];
          _results.push(deleteCaseID(caseID));
        }
        return _results;
      }
    });
  };

  putPage = function(req, res) {
    var data, icdsString, savetext;
    data = req.body;
    data.cid = req.params.id;
    data.lastEdit = new Date().getTime();
    data.creator = req.getAuthDetails().user.username;
    db.zadd("casesLastEdit", data.lastEdit, data.cid);
    db.zadd("cases", data.created, data.cid);
    data.lastEdit = data.lastEdit.toString();
    db.hset("case:" + data.cid, "title", data.title);
    if (data.texts) {
      savetext = JSON.stringify(data.texts);
      db.hset("case:" + req.params.id + ":page:" + req.params.page, "texts", savetext);
    }
    db.del("case:" + req.params.id + ":page:" + req.params.page + ":radios");
    if (data.modalities) {
      db.hset("case:" + req.params.id, "modalities", data.modalities);
    }
    if (data.description) {
      db.hset("case:" + req.params.id, "description", data.description);
    }
    if (data.radios) {
      db.del("case:" + req.params.id + ":page:" + req.params.page + ":radios");
      data.radios.forEach(function(r, rID) {
        db.set("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + r.id + ":caption", r.caption);
        return db.rpush("case:" + req.params.id + ":page:" + req.params.page + ":radios", r.id);
      });
    }
    if (data.icds) {
      db.del("case:" + req.params.id + ":icds");
      data.icds.forEach(function(i, iID) {
        return db.rpush("case:" + req.params.id + ":icds", i.code);
      });
      icdsString = JSON.stringify(data.icds);
      db.hset("case:" + req.params.id, "icds", icdsString);
    }
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
        db.hset("case:" + cid + ":page:" + page, "nextpage", nextpage);
        db.hset("case:" + cid + ":page:" + page, "prevpage", prevpage);
        db.hset("case:" + cid + ":page:" + page, "pagetype", req.body.pagetype);
        if (prevpage !== "0") {
          db.hset("case:" + cid + ":page:" + prevpage, "nextpage", page);
        }
        if (nextpage !== "0") {
          db.hset("case:" + cid + ":page:" + nextpage, "prevpage", page);
        }
        return res.send("/case/" + cid + "/" + page, 200);
      });
    });
  };

  removeCase = function(req, res) {
    var cid;
    cid = req.params.id;
    db.zrem("listed", cid);
    db.rpush("removedCases", cid);
    return res.send("OK, removed case", 200);
  };

  exports.removeCase = removeCase;

  exports.postNewpage = postNewpage;

  exports.putPage = putPage;

  exports.deletePage = deletePage;

  exports.rendercase = rendercase;

  exports.postImage2 = postImage2;

  exports.postImage = postImage;

  exports.cleanupCases = cleanupCases;

  exports.rendercases = rendercases;

  exports.renderRoot = renderRoot;

}).call(this);
