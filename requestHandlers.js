var formidable = require('formidable');
var url = require('url');

// rendercase renders theCase
// gets markdown-help
// gets the list of radios case:(caseid):page:(pageno):radios
// gets the list of images radio:(radioID) for each radio
// all is combined to json-object which is passed off for rendering

function render(req, res, theCase, editor) {
  console.log('last radio');
  console.dir(theCase);
  return res.render('case', {
    title: theCase.title || ' - untitled',
    radios: theCase.radios || '',
    texts: [theCase.texts] || '',
    creator: theCase.creator || '',
    created: theCase.created,
    mdhelp: mdhelp,
    signed_in: req.isAuthenticated(),
    user: req.getAuthDetails().user.username,
    cid: req.params.id,
    prevpage: parseInt(req.params.page, 10) - 1,
    nextpage: parseInt(req.params.page, 10) + 1,
    page: req.params.page,
    editor: editor,
    private: theCase.private || 0
  });
}


function rendercase(req, res, theCase, editor, db) {
  db.get('markdown-help', function(err, data) {
    mdhelp = JSON.parse(data);
    db.lrange('case:' + req.params.id + ':page:' + req.params.page + ":radios", 0, -1, function(err, radioIDs) {
      if (!radioIDs) return render(req, res, theCase, editor);
      theCase.radios = [];
      radioIDs.forEach(function(radioID, ID) {
        db.get('case:' + req.params.id + ':page:' + req.params.page + ":radio:" + radioID + ':caption', function(err, caption) {
          theCase.radios[ID] = [];
          theCase.radios[ID].ID = radioID;
          if (caption) theCase.radios[ID].caption = caption;
          db.lrange("radio:" + radioID, 0, -1, function(err, images) {
            theCase.radios[ID].images = [];
            images.forEach(function(image, imgID) {
              theCase.radios[ID].images[imgID] = image;
            });
            if (!radioIDs[ID + 1]) return render(req, res, theCase, editor);
          });
        });
      });
    });
  });
}

// postImage2 takes care of posted jpg:s,
// adds each filename to the list radio:(timems),
// adds (caseid) to the set image:(timems)
// adds (timems) to the list case:(caseid):page:(pageno),

function postImage2(req, res, db) {
  db.incr('numberOfRadios', function(err, radioID) {
    console.log(radioID);
    var imgNumber = 0;
    var form = new formidable.IncomingForm(),
            files = [],
            fields = [];
    form
            .on('field', function(field, value) {
              fields.push([field, value]);
    })
            .on('fileBegin', function(field, file) {
              console.dir(file);
              if (file.type = 'image/jpeg') {
                file.path = __dirname + '/img/' + radioID + '.' + imgNumber + '.jpg';
                db.rpush('radio:' + radioID, '/img/' + radioID + '.' + imgNumber + '.jpg');
                imgNumber ++;
              }
              files.push([field, file]);
            })
            .on('end', function() {
              console.log('-> upload done');
              db.sadd('image:' + radioID, req.params.id);
              db.rpush('case:' + req.params.id + ':page:' + req.params.page + ':radios', radioID);
              db.set('case:' + req.params.id + ':page:' + req.params.page + ":radio:" + radioID + ':caption', 'double click to add caption');
              res.send(radioID + '|' + imgNumber, 200);
            });
    form.parse(req, function(err, fields, files) {
    });
  });
}

function newpage(req, res, cid, page, db, pagedata) {
  var trypage = 'case:' + cid + ':page:' + page;
  db.get(trypage, function(err, data) {
    if (data) {
      page++;
      newpage(req, res, cid, page, db, pagedata);
    }
    else {
      //db.set(trypage, JSON.stringify(pagedata));
      db.hmset(trypage, pagedata);
      res.send('/case/' + cid + '/' + page, 200);
    }
  });
}

exports.rendercase = rendercase;
exports.newpage = newpage;
exports.postImage2 = postImage2;