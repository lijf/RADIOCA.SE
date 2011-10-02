var formidable = require('formidable'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    url = require('url'),
    zip = require('zip'),
    util = require('util'),
    fs = require('fs');

function postImage(req, res){
//  var d = req.params.id;
  var day = new Date();
  var d = day.getTime().toString();
  console.log(d);
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
//    console.log(err);
//    console.log(fields);
//    console.log(files);
    if(files.userfile.type == 'application/zip'){
      fs.mkdir(d,0755, function (){
      var child1 = exec('unzip -d ' + d + ' ' + files.userfile.path, // unzips the upload
      function (error, stdout, stderr) {
//        console.log('stdout: ' + stdout);
//        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
        var child2 = exec('find ' + d + ' -type f -exec mv {} ' + d + ' \\;',
        function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
          var child3 = exec('gm identify ./' + d + '/*.jpg',
          function (error, stdout, stderr) {
          if (error !== null) {
            console.log('exec error: ' + error);
          }
            var child4 = exec('gm montage -geometry 512 -tile 100000x1 ./' + d + '/*.jpg ' + __dirname + '/img/' + d + '.jpg', // makes a montage of uploaded images
            function (error, stdout, stderr) {
            if (error !== null) {
              console.log('exec error: ' + error);
            }
            var child5 = exec('rm -r ' +  d, // removes temporary directory
            function (error, stdout, stderr) {
              if (error !== null) {
                console.log('exec error: ' + error);
              }
              res.send(d,200);
                // TODO: save the image to redis-db. Also fix some error handling higher up in this chain
            });
           });
         });
        });
       });
      });
    }
  });
}

function postImage2(req, res){
  var day = new Date();
  var d = day.getTime().toString();
  console.log(d);
  var i = 0;
  var form = new formidable.IncomingForm(),
      files = [],
      fields = [];
  //form.uploadDir = __dirname + '/img/';
  form
    .on('field', function(field, value) {
        console.log(field, value);
        fields.push([field, value]);
    })
    .on('fileBegin', function(field, file) {
          console.log(file.filename);
          if(file.type='image/jpeg') {
            file.path = __dirname + '/img/' + d + '.' + i + '.jpg';
            i ++;
          }
          console.log(field, file);
          files.push([field, file]);
    })
    .on('end', function() {
        console.log('-> upload done');
        console.log(util.inspect(fields));
        console.log(util.inspect(files));
        res.send(d + '|' + i, 200);
          // TODO: fix the image montage.
    });
  form.parse(req, function(err, fields, files){
  //    // console.dir(files);
  //      if(files.userfile.type == 'application/zip'){
  //          //zipfile = files.userfile;
  //          //console.dir(zipfile);
  //          var reader = zip.Reader(zipfile);
  //          console.log(reader.readLocalFileHeader());
  //          console.log(reader.readDataDescriptor());
  //          //reader.forEach(function(entry){
  //            //var matchimage = /\.(jpg|jpeg|png|gif)$/i;
  //            //if(matchimage.test(entry.getName())){
  //            //   console.log(entry.getName());
  //            //}
  //            //console.log(i++);
  //        //});
  //      }
    });
}

exports.postImage = postImage;
exports.postImage2 = postImage2;