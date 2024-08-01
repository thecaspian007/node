var fs = require('fs');
var filename = 'message.txt'; //Name of the file to be read
var content = fs.readFileSync(filename);
console.log('Content : ' + content);