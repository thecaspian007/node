var fs = require('fs');

var content = "this is the content from the \"file_writer_sync\" file";

fs.writeFileSync('message.txt', content);
console.log("File Written Successfully");