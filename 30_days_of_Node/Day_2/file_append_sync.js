var fs = require('fs');
var content = "This data from \"file_writer_sync\" will be appended at the end of the file.";
fs.appendFileSync('message.txt', content);
console.log("File Appended Successfully");