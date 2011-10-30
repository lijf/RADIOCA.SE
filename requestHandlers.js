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

function popradios_old(req, res, theCase, editor, radioID, radios, db, i){
    db.lrange('radio:' + radioID[i], 0, -1, function(err, images){
        if(err || !images[0]){
        //console.dir(radios);
        return res.render('case', {
            title: theCase.title || ' - untitled',
            radios: radios || '',
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
        else{
            console.dir(images);
            //radios[i].images = images;
            i++;
            popradios(req, res, theCase, editor, radioID, radios, db, i);
        }
    });
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
});
}


function rendercase_old(req, res, theCase, editor, db){
    db.get("markdown-help", function(err, data){
      mdhelp = JSON.parse(data);
      db.lrange("case:" + req.params.id + ":page:" + req.params.page + ':radios', 0, -1, function(err, radioID){
        if(err || !radioID[0]){console.log('no radio found')}
        else{console.log(radioID);
             var radios = [];
             var i = 0;
             popradios(req, res, theCase, editor, radioID, radios, db, i);
        }
      });
    });
}

function postImage2(req, res, db){
  var day = new Date();
  var d = day.getTime().toString();
  //console.log(d);
  var i = 0;
  var form = new formidable.IncomingForm(),
      files = [],
      fields = [];
  //form.uploadDir = __dirname + '/img/';
  form
    .on('field', function(field, value) {
        //console.log(field, value);
        fields.push([field, value]);
    })
    .on('fileBegin', function(field, file) {
          //console.log(file.filename);
          if(file.type='image/jpeg') {
            file.path = __dirname + '/img/' + d + '.' + i + '.jpg';
            db.rpush('radio:' + d, '/img/' + d + '.' + i + '.jpg');
            i ++;
          }
          //console.log(field, file);
          files.push([field, file]);
    })
    .on('end', function() {
        console.log('-> upload done');
        db.sadd('image:' + d, req.params.id);
        db.rpush('case:' + req.params.id + ':page:' + req.params.page + ':radios', d);
        //console.log(util.inspect(fields));
        //console.log(util.inspect(files));
        res.send(d + '|' + i, 200);
          // TODO: fix the image montage.
    });
  form.parse(req, function(err, fields, files){
  });
}

function newpage(req, res, cid, page, db, pagedata){
            var trypage = 'case:' + cid + ':page:' + page;
            db.get(trypage, function(err, data){
                if(!data){
                    db.set(trypage, JSON.stringify(pagedata));
                    // sends pageinfo to client after creation.
                    res.send('/case/' + cid + '/' + page, 200);
                } else {
                    // if page exists, try another page
                    page++;
                    newpage(req, res, cid, page, db, pagedata);
                }
            });
        }

exports.rendercase = rendercase;
exports.getCases = getCases;
exports.newpage = newpage;
exports.postImage2 = postImage2;