var formidable = require('formidable'),
    url = require('url');

function getCases(req, res, data, i, sendcases, db){
    if(data[i]){
        db.hgetall('case:' + data[i] + ':page:1', function(err, sendcase){
            sendcases[i] = sendcase;
            i++;
            if(data[i]){getCases(data, i, sendcases)}
            else{res.render('cases', {
                title: 'Cases',
                signed_in: req.isAuthenticated(),
                user: req.getAuthDetails().user.username,
                cases: sendcases
            })}
        });
    } else{return 'No data'}
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
            i ++;
          }
          //console.log(field, file);
          files.push([field, file]);
    })
    .on('end', function() {
        console.log('-> upload done');
        db.sadd('image:' + d, 'req.params.id');
        db.rpush('case:' + req.params.id + ':page:' + req.params.page + ':images', d);
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

function renderpage(req, res, db){
    var findcase = 'case:' + req.params.id;
    var findpage = 'case:' + req.params.id + ':page:' + req.params.page;
    db.smembers(findcase + ':users', function(err, editors){
        var editor=0;
        var edit_or_feedback;
        var editfeedbacktext = "Feedback";
        if(include(editors, req.getAuthDetails().user.user_id)){
            console.log('found in editors');
            edit_or_feedback="editbutton";
            editfeedbacktext="Edit";
            editor=1;
        } else {
            edit_or_feedback="feedbackbutton"
        }
        db.mget(findpage, "markdown-help", function(err, data){
            //console.dir(data);
            if(!data[0]){res.redirect('back')} else {
                //console.log(data[0]);
                var thePage = JSON.parse(data[0].toString());
                var mdhelp = JSON.parse(data[1].toString());
                var prevpage = parseInt(req.params.page, 10) - 1;
                var nextpage = parseInt(req.params.page, 10) + 1;
                //console.dir(theCase);
                return res.render('case', {
                    title: thePage.title || ' - untitled',
                    radios: thePage.radios || '',
                    texts: thePage.texts || '',
                    creator: theCase.creator || '',
                    mdhelp: mdhelp,
                    edit_or_feedback: edit_or_feedback,
                    editfeedbacktext: editfeedbacktext,
                    signed_in: req.isAuthenticated(),
                    user: req.getAuthDetails().user.username,
                    cid: req.params.id,
                    prevpage: prevpage,
                    nextpage: nextpage,
                    page: req.params.page,
                    editor: editor,
                    meta_private: thePage.meta_private || 0,
                    meta_icd: thePage.icd
                });
            }
        });
    });
}
exports.getCases = getCases;
exports.renderpage = renderpage;
exports.newpage = newpage;
exports.postImage2 = postImage2;