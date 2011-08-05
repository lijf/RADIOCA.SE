var formidable = require('formidable'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    url = require('url'),
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
            });
           });
         });
        });
       });
      });
    }
  });
}

exports.postImage = postImage;
