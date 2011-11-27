(function() {
  var formidable, newpage, postImage2, render, rendercase, url;
  render = function(req, res, theCase, editor) {
    return res.render("case", {
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
      feedback: theCase.feedback || ''
    });
  };
  rendercase = function(req, res, theCase, editor, db) {
    return db.get("markdown-help", function(err, data) {
      theCase.mdhelp = JSON.parse(data);
      return db.lrange("case:" + req.params.id + ":page:" + req.params.page + ":radios", 0, -1, function(err, radioIDs) {
        if (radioIDs.length < 1) {
          return render(req, res, theCase, editor);
        }
        theCase.radios = [];
        return radioIDs.forEach(function(radioID, ID) {
          return db.get("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + radioID + ":caption", function(err, caption) {
            theCase.radios[ID] = [];
            theCase.radios[ID].ID = radioID;
            if (caption) {
              theCase.radios[ID].caption = caption;
            }
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
  };
  postImage2 = function(req, res, db) {
    var d, fields, files, form, i;
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
      db.rpush("case:" + req.params.id + ":page:" + req.params.page + ":radios", d);
      db.rpush("user:" + req.getAuthDetails().user.username + ":radios", d);
      db.set("case:" + req.params.id + ":page:" + req.params.page + ":radio:" + d + ":caption", "double click to add caption");
      res.send(d, 200);
      return console.log("-> upload done");
    });
    return form.parse(req, function(err, fields, files) {});
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
  formidable = require("formidable");
  url = require("url");
  exports.rendercase = rendercase;
  exports.newpage = newpage;
  exports.postImage2 = postImage2;
}).call(this);
