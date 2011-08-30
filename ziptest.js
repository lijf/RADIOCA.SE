var zip = require("zip");
var fs = require("fs");
var data = fs.readFile("SD.zip");
var reader = zip.Reader(data);
console.log(reader.toObject('utf8'));