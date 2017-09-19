const WebSocket = require("websocket");
const server_http = require("./http.js");


// server constants
const MAX_CONNECTIONS = 50;

// global variables
const connections = [];
const server_websocket = new WebSocket.server({httpServer: server_http});


function alias_set(id_player, alias)
{
	let inuse = false;
	for (let i = 0; i < connections.length; ++i)
		if (i !== id_player && connections[i].alias === alias)
		{
			inuse = true;
			break;
		}
	
	if (inuse)
		throw new Error("Name in use");
	
	connections[id_player].alias = alias;
}


server_websocket.on("request", function(request)
{
	if (connections.length < MAX_CONNECTIONS)
	{
		const connection = request.accept(null, request.origin);
		const id_player = connections.length;
		connections.push(connection);
		
		alias_set(id_player, "player_" + Math.floor(Math.random()*10000));
		
		console.log(connection.alias + " connected.");
		
		connection.on("close", function()
		{
			console.log(connection.alias + " disconnected.");
			connections.splice(connections.indexOf(connection), 1);
		});
	}
	else
		request.reject();
});