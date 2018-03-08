const websocket = require("websocket");
const mongo = require("mongodb");

const server_http = require("./http.js");
const config = require("./config.json");
const Game = require("./game/game.js");
const Data = require("./data.js");
const BufferWriter = require("./bufferwriter.js");


// global variables
const connections = {};
const queue = {};
let len_queue = 0;


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
		
		global.collections = {};
		
		db.collection("abilities").find().toArray(function(error, abilities)
		{
			Data.abilities = {};
			for(let i = 0; i < abilities.length; ++i)
				Data.abilities[abilities[i]._id] = abilities[i];
		});
		
		db.collection("cards").find().toArray(function(error, cards)
		{
			Data.cards = {};
			for(let i = 0; i < cards.length; ++i)
				Data.cards[cards[i]._id] = cards[i];
		});
		
		db.collection("creatures").find().toArray(function(error, creatures)
		{
			Data.creatures = {};
			for(let i = 0; i < creatures.length; ++i)
				Data.creatures[creatures[i]._id] = creatures[i];
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

function read_string(buffer, index)
{
	let char, string = "";
	
	while(index < buffer.length && (char = buffer.readUInt8(index++)))
		string += String.fromCharCode(char);
	
	return string;
}


const processes =
[
	// chat message
	function(connection, buffer_process)
	{
		const buffer = [0x00];
		
		BufferWriter.string(buffer, connection.player._id);
		for(let i = 1; i < buffer_process.length; ++i)
			buffer.push(buffer_process.readUInt8(i));
		broadcast(Buffer.from(buffer));
	},
	
	// player joins queue
	function(connection)
	{
		if (queue[connection.player._id])
			connection.sendBytes(Buffer.from([0x0E]));
		else
		{
			connection.sendBytes(Buffer.from([0x0D]));
			
			// NOTE(shawn): temp queue code; implement matchmaking
			if(len_queue > 0)
			{
				// get first player in queue
				let opponent, id_opponent;
				for(id_opponent in queue)
				{
					opponent = queue[id_opponent];
					break;
				}
				
				connection.game = opponent.game = new Game(connection.player, opponent.player);
				
				const buffer_player = [0x09];
				BufferWriter.string(buffer_player, opponent.player._id);
				connection.sendBytes(Buffer.from(buffer_player));
				
				const buffer_opponent = [0x09];
				BufferWriter.string(buffer_opponent, connection.player._id);
				opponent.sendBytes(Buffer.from(buffer_opponent));
				
				const id_player1 = connection.game.players[0]._id;
				const id_player2 = connection.game.players[1]._id;
				
				connections[id_player1].sendBytes(Buffer.from(connection.game.encodestate(0).unshift(0x0A)));
				connections[id_player2].sendBytes(Buffer.from(connection.game.encodestate(1).unshift(0x0A)));
				
				connections[connection.game.players[connection.game.state.index_currentplayer]._id].sendBytes(Buffer.from([0x0B]));
				
				delete queue[id_opponent];
				len_queue--;
			}
			else
			{
				queue[connection.player._id] = connection;
				len_queue++;
			}
		}
	},
	
	// player leaves queue
	function(connection)
	{
		if(queue[connection.player._id] === undefined)
			connection.sendBytes(Buffer.from([0x0F]));
		else
		{
			delete queue[connection.player._id];
			len_queue--;
			
			connection.sendBytes(Buffer.from([0x10]));
		}
	},
	
	// player changes active loadout
	function(connection, buffer_process)
	{
		const id_loadout = read_string(buffer_process, 1);
		
		// TODO(shawn): implement
		connection.sendBytes(Buffer.from([0x08]));
	},
	
	// player concedes
	function(connection)
	{
		const game = connection.game;
		
		if(game === undefined)
			connection.sendBytes(Buffer.from([0x0C]));
		else
		{
			const opponent = connections[game.players[0] === connection.player ? 1 : 0];
			
			connection.sendBytes(Buffer.from([0x11, 0x00]));
			opponent.sendBytes(Buffer.from([0x11, 0x01]));
			
			delete connection.game;
			delete opponent.game;
		}
	},
	
	// play card
	function()
	{
		
	},
	
	// end turn
	function(connection)
	{
		const game = connection.game;
		
		if(game === undefined)
			connection.sendBytes(Buffer.from([0x0C]));
		else if(connection.player !== game.players[game.state.index_currentplayer])
			connection.sendBytes(Buffer.from([0x14]));
		else
		{
			game.endturn();
			
			
		}
	},
	
	// use ability
	function()
	{
		
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
					BufferWriter.string(buffer, player._id);
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
					BufferWriter.string(buffer, id_player);
					BufferWriter.string(buffer, connections[id_player].player.name);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send login success message
				buffer = [0x07];
				BufferWriter.string(buffer, player._id);
				connection.sendBytes(Buffer.from(buffer));
				
				// broadcast player join message
				buffer = [0x05];
				BufferWriter.string(buffer, player._id);
				BufferWriter.string(buffer, player.name);
				broadcast(Buffer.from(buffer));
				console.log(player.name + " connected.");
				
				// send ability data dump
				buffer = [0x01];
				for(let i = 0; i < Data.abilities.length; ++i)
				{
					const ability = Data.abilities[i];
					
					BufferWriter.string(buffer, ability._id);
					BufferWriter.string(buffer, ability.name);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send card data dump
				buffer = [0x02];
				for(let i = 0; i < Data.cards.length; ++i)
				{
					const card = Data.cards[i];
					
					BufferWriter.string(buffer, card._id);
					BufferWriter.string(buffer, card.name);
					buffer.push(card.cost);
				}
				connection.sendBytes(Buffer.from(buffer));
				
				// send creature data dump
				buffer = [0x03];
				for(let i = 0; i < Data.creatures.length; ++i)
				{
					const creature = Data.creatures[i];
					
					BufferWriter.string(buffer, creature._id);
					BufferWriter.string(buffer, creature.name);
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