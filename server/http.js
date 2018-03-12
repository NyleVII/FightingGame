const fs = require("fs");
const path = require("path");
const http = require("http");


module.exports = http.createServer(function(request, response)
{
	let filename = request.url;
	if(filename === "/")
		filename = "/index.html";
	
	const ext = path.extname(filename);
	let type = "text/html";
	
	if(ext === ".js")
		type = "text/javascript";
	else if(ext === ".css")
		type = "text/css";
	else if(ext === ".png")
		type = "image/png";
	
	fs.readFile("client" + filename, function(error, content)
	{
		if(error === null)
		{
			response.writeHead(200, {"Content-Type": type});
			response.end(content, "utf-8");
		}
		else
		{
			response.writeHead(404);
			response.end(content, "utf-8");
		}
	});
});