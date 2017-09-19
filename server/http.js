const fs = require("fs");
const path = require("path");
const http = require("http");

server_http = http.createServer(function(request, response)
{
	let filename = request.url;
	if (filename === "/")
		filename = "/index.html";
	
	const ext = path.extname(filename);
	let type = "text/html";
	
	if (ext === ".js")
		type = "text/javascript";
	else if (ext === ".css")
		type = "text/css";
	
	fs.readFile("client" + filename, function(error, content)
	{
		if (!error)
		{
			response.writeHead(200, {"Content-Type": type});
			response.end(content, "utf-8");
		}
	});
});

server_http.listen(80);