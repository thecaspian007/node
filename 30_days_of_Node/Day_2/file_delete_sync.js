var fs = require('fs');
var filename = 'content.txt';
fs.unlinkSync(filename);
console.log('File Deleted Successfully');