const WebSocket = require("websocket");

require("./http.js");


// server constants
const MAX_CONNECTIONS = 50;

// global variables
const connections = [];


const server_websocket = new WebSocket.server({httpServer: server_http});

server_websocket.on("request", function(request)
{
	console.log(request);
});