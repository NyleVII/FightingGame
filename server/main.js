const websocket = require("websocket");
const mongo = require("mongodb");

const server_http = require("./http.js");
const config = require("./config.json");
const Game = require("./game/game.js");


// server constants
const MAX_CONNECTIONS = 50;

// global variables
const connections = [];
const games = [];


// initialize web server
server_http.listen(config.app_port);
const server_websocket = new websocket.server({httpServer: server_http});

// intialize mongo database connection
mongo.MongoClient.connect("mongodb://" + config.mongo_host + ":" + config.mongo_port + "/" + config.mongo_db, function(error, db)
{
	if (error !== null)
		console.error(error);
	else
	{
		global.data = {};
		global.collections = {};
		
		db.collection("abilities").find().toArray(function(error, result)
		{
			global.data.abilities = result;
		});
		
		db.collection("cards").find().toArray(function(error, result)
		{
			global.data.cards = result;
		});
		
		db.collection("creatures").find().toArray(function(error, result)
		{
			global.data.creatures = result;
		});
		
		global.collections.decks = db.collection("decks");
		global.collections.players = db.collection("players");
	}
});


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
		
		// TEMP(shawn): create game when two players connect
		if (connections.length === 1)
		{
			games.push(new Game(0, 1));
		}
		
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