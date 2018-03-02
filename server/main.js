const websocket = require("websocket");
const mongo = require("mongodb");

const server_http = require("./http.js");
const config = require("./config.json");
const Game = require("./game/game.js");


// global variables
const connections = {};
const queue = {};
const games = {};


// initialize web server
server_http.listen(config.app_port);
const server_websocket = new websocket.server({httpServer: server_http});

// intialize mongo database connection
mongo.MongoClient.connect("mongodb://" + config.mongo_host + ":" + config.mongo_port + "/" + config.mongo_db, function(error, client)
{
	if (error !== null)
		console.error(error);
	else
	{
		const db = client.db("game");
		
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
		
		global.collections.loadouts = db.collection("loadouts");
		global.collections.players = db.collection("players");
	}
});


function broadcast(buffer)
{
	for(const id_player in connections)
		connections[id_player].sendBytes(buffer);
}

function buffer_string(buffer, string)
{
	for(let i = 0; i < string.length; ++i)
		buffer.push(string.charCodeAt(i) & 0xff);
	buffer.push(0x00);
}


const processes =
[
	// chat message
	function(connection, buffer_process)
	{
		const buffer = [0x00];
		
		buffer_string(buffer, connection.player._id);
		for(let i = 1; i < buffer_process.length; ++i)
			buffer.push(buffer_process.readUInt8(i));
		broadcast(Buffer.from(buffer));
	},
	
	// player joins queue
	function(connection)
	{
		// NOTE(shawn): temp queue code; implement matchmaking
		if(queue.length)
		{
			const id_game = 0;
			
			games[id_game] = new Game(connection.player, queue[0].player);
		}
		else
		{
			queue.push(connection);
		}
	}
];


server_websocket.on("request", function(request)
{
	global.collections.players.find().toArray(function(error, players)
	{
		for(let i = 0; i < players.length; ++i)
		{
			const player = players[i];
			
			if(connections[player._id] === undefined)
			{
				let buffer;
				
				const connection = connections[player._id] = request.accept(null, request.origin);
				connection.player = player;
				
				connection.on("close", function()
				{
					delete connections[player._id];
					
					// broadcast player left message
					buffer = [0x06];
					buffer_string(buffer, player._id);
					broadcast(Buffer.from(buffer));
					console.log(player.name + " disconnected.");
				});
				
				connection.on("message", function(message)
				{
					const buffer = message.binaryData;
					
					const process = processes[buffer.readUInt8(0)];
					if(process !== undefined)
						process(connection, buffer);
				});
				
				// send full player list
				buffer = [0x04];
				for(const id_player in connections)
				{
					buffer_string(buffer, id_player);
					buffer_string(buffer, connections[id_player].player.name);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send login success message
				buffer = [0x07];
				buffer_string(buffer, player._id);
				connection.sendBytes(Buffer.from(buffer));
				
				// broadcast player join message
				buffer = [0x05];
				buffer_string(buffer, player._id);
				buffer_string(buffer, player.name);
				broadcast(Buffer.from(buffer));
				console.log(player.name + " connected.");
				
				// send ability data dump
				buffer = [0x01];
				for(let i = 0; i < global.data.abilities.length; ++i)
				{
					const ability = global.data.abilities[i];
					
					buffer_string(buffer, ability._id);
					buffer_string(buffer, ability.name);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send card data dump
				buffer = [0x02];
				for(let i = 0; i < global.data.cards.length; ++i)
				{
					const card = global.data.cards[i];
					
					buffer_string(buffer, card._id);
					buffer_string(buffer, card.name);
					buffer.push(card.cost);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send creature data dump
				buffer = [0x03];
				for(let i = 0; i < global.data.creatures.length; ++i)
				{
					const creature = global.data.creatures[i];
					
					buffer_string(buffer, creature._id);
					buffer_string(buffer, creature.name);
					buffer.push(creature.attack);
					buffer.push(creature.health);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				return;
			}
		}
		
		request.reject();
	});
});