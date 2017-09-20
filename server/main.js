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

function broadcast_players()
{
	for (const i in connections)
		connections[i].send("players " + connections.map(function(connection)
		{
			return connection.alias;
		}).join(","));
}


const processes =
{
	chat: function(connection, params)
	{
		for (const i in connections)
			connections[i].send("chat " + connections.indexOf(connection) + " " + params);
	}
};


server_websocket.on("request", function(request)
{
	if (connections.length < MAX_CONNECTIONS)
	{
		const connection = request.accept(null, request.origin);
		const id_player = connections.length;
		connections.push(connection);
		
		alias_set(id_player, "player_" + Math.floor(Math.random()*10000));
		
		broadcast_players();
		
		connection.on("close", function()
		{
			connections.splice(connections.indexOf(connection), 1);
			broadcast_players();
		});
		
		connection.on("message", function(message)
		{
			const input = message.utf8Data;
			const sep = input.indexOf(" ");
			
			let type, params;
			if (sep === -1)
			{
				type = input;
				params = "";
			}
			else
			{
				type = input.slice(0, sep);
				params = input.slice(sep + 1);
			}
			
			if (processes[type] !== undefined)
				processes[type](connection, params);
		});
	}
	else
		request.reject();
});