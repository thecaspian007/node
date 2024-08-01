var fs =  require('fs');
var content= "this is the content from the \"file_writer_async\" file";
fs.writeFile('message.txt', content , (err) => {
	if (err) 
		throw err;
	console.log('It\'s saved!');
});