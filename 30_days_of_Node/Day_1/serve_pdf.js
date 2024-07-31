var http = require('http');
var fs = require('fs');
console.log('Server will listen at :  127.0.0.1:3000 ');
http.createServer( (req, res)=> {
	console.log("Port Number : 3001");
	// Change the MIME type to application/pdf
	res.writeHead(200, {"Content-Type": "application/pdf"});
	 
	fs.readFile('index.pdf', (error,data) => {
		if(error){
			res.json({'status':'error',msg:err});
		}else{			
			res.write(data);
			res.end();       
		}
	});
}).listen(3001);