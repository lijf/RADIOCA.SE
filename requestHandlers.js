var formidable = require('formidable'),
    url = require('url');

function getCases(req, res, data, i, sendcases, db){
    if(data[i]){
        db.hgetall('case:' + data[i] + ':page:1', function(err, sendcase){
            sendcases[i] = sendcase;
            i++;
            if(data[i]){getCases(data, i, sendcases)}
            else{console.log('rendering cases');res.render('cases', {
                title: 'Cases',
                signed_in: req.isAuthenticated(),
                user: req.getAuthDetails().user.username,
                cases: sendcases
            })}
        });
    } else{return 'No data'}
}

function popradios(req, res, theCase, db){
    db.lrange('case:' + req.params.id + ':page:' + req.params.page + ":radios",
        0, -1, function(err, radioIDs){
            theCase.radios = [];
            radioIDs.forEach(function(radioID, ID){
                theCase.radios[ID] = [];
                theCase.radios[ID].ID = radioID;
                db.lrange("radio:" + radioID, 0, -1, function(err, images){
                    theCase.radios[ID].images = [];
                    images.forEach(function(image, imgID){
                        theCase.radios[ID].images[imgID] = image;
                    });
                    if(!radioIDs[ID+1])
                    {
                        console.log('last radio');
                        return res.render('case', {
                            title: theCase.title || ' - untitled',
                            radios: theCase.radios || '',
                            texts: [theCase.texts] || '',
                            creator: theCase.creator || '',
                            mdhelp: mdhelp,
                            signed_in: req.isAuthenticated(),
                            user: req.getAuthDetails().user.username,
                            cid: req.params.id,
                            prevpage: parseInt(req.params.page, 10) - 1,
                            nextpage: parseInt(req.params.page, 10) + 1,
                            page: req.params.page,
                            editor: editor,
                            meta_private: theCase.meta_private || 0
                        });
                    }
                    //console.dir(theCase.radios[ID].images);
                });
            });
    });
}

function rendercase(req, res, theCase, editor, db){
    db.get("markdown-help", function(err, data){
        mdhelp = JSON.parse(data);
        db.lrange('case:' + req.params.id + ':page:' + req.params.page + ":radios",
            0, -1, function(err, radioIDs){
                theCase.radios = [];
                radioIDs.forEach(function(radioID, ID){
                    theCase.radios[ID] = [];
                    theCase.radios[ID].ID = radioID;
                    db.lrange("radio:" + radioID, 0, -1, function(err, images){
                        theCase.radios[ID].images = [];
                        images.forEach(function(image, imgID){
                            theCase.radios[ID].images[imgID] = image;
                        });
                        if(!radioIDs[ID+1]){
                            console.log('last radio');
                            console.dir(theCase);
                            return res.render('case', {
                                title: theCase.title || ' - untitled',
                                radios: theCase.radios || '',
                                texts: [theCase.texts] || '',
                                creator: theCase.creator || '',
                                mdhelp: mdhelp,
                                signed_in: req.isAuthenticated(),
                                user: req.getAuthDetails().user.username,
                                cid: req.params.id,
                                prevpage: parseInt(req.params.page, 10) - 1,
                                nextpage: parseInt(req.params.page, 10) + 1,
                                page: req.params.page,
                                editor: editor,
                                meta_private: theCase.meta_private || 0
                            });
                        }
                    });
                });
            });
});
}

function postImage2(req, res, db){
  var day = new Date();
  var timems = day.getTime().toString();
  var iteration = 0;
  var form = new formidable.IncomingForm(),
      files = [],
      fields = [];
  form
    .on('field', function(field, value) {
        fields.push([field, value]);
    })
    .on('fileBegin', function(field, file) {
          if(file.type='image/jpeg') {
            file.path = __dirname + '/img/' + timems + '.' + iteration + '.jpg';
            db.rpush('radio:' + timems, '/img/' + timems + '.' + iteration + '.jpg');
            iteration ++;
          }
          files.push([field, file]);
    })
    .on('end', function() {
        console.log('-> upload done');
        db.sadd('image:' + timems, req.params.id);
        db.rpush('case:' + req.params.id + ':page:' + req.params.page + ':radios', timems);
        res.send(timems + '|' + iteration, 200);
    });
  form.parse(req, function(err, fields, files){
  });
}

function newpage(req, res, cid, page, db, pagedata){
            var trypage = 'case:' + cid + ':page:' + page;
            db.get(trypage, function(err, data) {
                if (data) {
                    page++;
                    newpage(req, res, cid, page, db, pagedata);
                } 
                else {
                    db.set(trypage, JSON.stringify(pagedata));
                    res.send('/case/' + cid + '/' + page, 200);
                }
            });
        }

exports.rendercase = rendercase;
exports.getCases = getCases;
exports.newpage = newpage;
exports.postImage2 = postImage2;