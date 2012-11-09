var express = require ('express');
var http = require('http');
var util = require('util');
var url = require('url');
var querystring = require('querystring');
var fs = require('fs');
var im = require('imagemagick');

var app = express();
app.configure(function(){
	app.set('port', process.env.PORT||3000);
	app.use(app.router);
});
app.get('/',getImage, convertImage, outputImage);
function getImage(req,res,next) {

	// console.log(req.query.u)
	// res.send(req.query.u)
	var imageUrl = url.parse(req.query.u);
	var pathname = imageUrl.pathname;
	var filename = pathname.substring(pathname.lastIndexOf('/')+1);
	// console.log(filename)
	req.filename=filename;
	req.width=req.query.w;
	req.height=req.query.h;
	req.gravity = req.query.g || "Center";
	req.cfilename = "converted_"+req.width+"x"+req.height+"_"+req.gravity+"_"+req.filename;
	//TODO: check if image already exists 
	fs.stat(filename, function(err,stats){
		// if (err) console.log(err);
		if (!err&&stats.isFile()) {
			console.log("Located "+filename)
			//we already have the image
			next();			
		}
		else {
			//download NEW image
			console.log("Downloading "+filename)
			var imageReq = http.request(imageUrl, function(imageRes) {
				console.log("Got response: " + imageRes.statusCode);
				console.log(filename)
				console.log(filename)
				var stream = fs.createWriteStream(filename);
				imageRes.pipe(stream);
				imageRes.on('end', function () {
					console.log('File is downloaded: '+filename);
					next();					
				});				
			});
			imageReq.on('error', function(e) {
				console.log("Got error: " + e.message);
				throw(e);
			});
	
			imageReq.end();			

		}
	});

}
function convertImage(req,res,next){
	
	//check if converted image exists
	fs.stat(req.cfilename, function(err,stats){
		// if (err) console.warn(err);
		if (err||!stats.isFile()){
			//convert new image version
			console.log("new converted image: "+req.cfilename);
			im.identify(req.filename, function(err, features){
				if (err) console.warn(err);
				console.log(features.width);
				console.log(features.height);
				console.log(req.filename)
				im.crop({
				  srcPath: req.filename,
				  dstPath: req.cfilename,
				  width: req.width,
				  height: req.height,
				  quality: 1,
				  gravity: req.gravity,
				}, function(err, stdout, stderr){
					next();	
				})
			})
			
		}
		else {
			//we already have this version of the image
			console.log('Located '+req.cfilename);
			next();
		}
	});
}

function outputImage(req,res){
	//output image
	fs.readFile(req.cfilename, function(err, data) {
		if (err) console.warn(err); // Fail if the file can't be read.
    	res.writeHead(200, {'Content-Type': 'image/jpeg'});
	    res.end(data); // Send the file data to the browser.
	});

}
http.createServer(app);
app.listen(app.get('port'), function(){console.log('Server is running');});