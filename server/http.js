const fs = require("fs");
const path = require("path");
const http = require("http");


module.exports = http.createServer(function(request, response)
{
	let filename = request.url;
	if(filename === "/")
		filename = "/index.html";
	
	let type = "text/html";
	if(filename === "/protocol")
	{
		type = "application/json";
		filename = "netprotocol.json";
	}
	else
	{
		const ext = path.extname(filename);
		
		if(ext === ".js")
			type = "application/javascript";
		else if(ext === ".css")
			type = "text/css";
		else if(ext === ".png")
			type = "image/png";
		
		filename = "client" + filename;
	}
	
	fs.readFile(filename, function(error, content)
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