const websocket = require("websocket");
const mongo = require("mongodb");

const server_http = require("./http.js");
const config = require("../appconfig.json");
const Game = require("./game/game.js");
const Data = require("./data.js");
const BufferWriter = require("./bufferwriter.js");
const Network = require("./network.js");
const NetProtocol = require("../netprotocol.json");


// global variables
const connections = {};
const queue = {};
const games = [];
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


const processes = {};

processes[NetProtocol.server.LOGIN] = function()
{
	// LOGIN
};

processes[NetProtocol.server.CHAT] = function(connection, buffer_process)
{
	const buffer = [NetProtocol.client.CHAT];
	
	BufferWriter.string(buffer, connection.player._id);
	for(let i = 1; i < buffer_process.length; ++i)
		buffer.push(buffer_process.readUInt8(i));
	broadcast(Buffer.from(buffer));
};

processes[NetProtocol.server.QUEUE_JOIN] = function(connection)
{
	if (queue[connection.player._id])
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.ALREADY_IN_QUEUE]);
	else
	{
		Network.send(connection, [NetProtocol.client.QUEUE_JOINED]);
		
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
			
			const game = connection.game = opponent.game = new Game(connection, opponent);
			games.push(game);
			
			game.loaded.then(function()
			{
				const buffer_player = [NetProtocol.client.GAMESTART];
				BufferWriter.string(buffer_player, opponent.player._id);
				Network.send(connection, buffer_player);
				
				const buffer_opponent = [NetProtocol.client.GAMESTART];
				BufferWriter.string(buffer_opponent, connection.player._id);
				Network.send(opponent, buffer_opponent);
				
				const prefix = [NetProtocol.client.GAME, NetProtocol.client.game.STATE];
				Network.send(game.connections[0], prefix.concat(game.encodestate(0)));
				Network.send(game.connections[1], prefix.concat(game.encodestate(1)));
				
				Network.send(game.connections[game.state.index_currentplayer], [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_PLAYER]);
				Network.send(game.connections[game.state.index_currentplayer ^ 1], [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_OPPONENT]);
			});
			
			delete queue[id_opponent];
			len_queue--;
		}
		else
		{
			queue[connection.player._id] = connection;
			len_queue++;
		}
	}
};

processes[NetProtocol.server.QUEUE_LEAVE] = function(connection)
{
	if(queue[connection.player._id] === undefined)
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.NOT_IN_QUEUE]);
	else
	{
		delete queue[connection.player._id];
		len_queue--;
		
		Network.send(connection, [NetProtocol.client.QUEUE_LEFT]);
	}
};

processes[NetProtocol.server.LOADOUT_ACTIVE] = function(connection)
{
	// TODO(shawn): implement
	// const id_loadout = read_string(buffer_process, 1);
	Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.INVALID_LOADOUT]);
};

processes[NetProtocol.server.GAME] = function(connection, buffer_process)
{
	if(connection.game === undefined)
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.NOT_IN_GAME]);
	else
		connection.game.process(connection.game.connections.indexOf(connection), buffer_process);
};


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
					
					if(queue[player._id] !== undefined)
					{
						delete queue[player._id];
						len_queue--;
					}
					
					// broadcast player left message
					const buffer = [NetProtocol.client.PLAYER_LEFT];
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
				buffer = [NetProtocol.client.PLAYER_LIST];
				for(const id_player in connections)
				{
					BufferWriter.string(buffer, id_player);
					BufferWriter.string(buffer, connections[id_player].player.name);
				}
				Network.send(connection, buffer);
				
				// send login success message
				buffer = [NetProtocol.client.LOGIN];
				BufferWriter.string(buffer, player._id);
				Network.send(connection, buffer);
				
				// broadcast player join message
				buffer = [NetProtocol.client.PLAYER_JOINED];
				BufferWriter.string(buffer, player._id);
				BufferWriter.string(buffer, player.name);
				broadcast(Buffer.from(buffer));
				console.log(player.name + " connected.");
				
				// send ability data dump
				buffer = [NetProtocol.client.DATADUMP_ABILITY];
				for(const id_ability in Data.abilities)
				{
					const ability = Data.abilities[id_ability];
					
					BufferWriter.string(buffer, ability._id);
					BufferWriter.string(buffer, ability.name);
				}
				Network.send(connection, buffer);
				
				// send card data dump
				buffer = [NetProtocol.client.DATADUMP_CARD];
				for(const id_card in Data.cards)
				{
					const card = Data.cards[id_card];
					
					BufferWriter.string(buffer, card._id);
					BufferWriter.string(buffer, card.name);
					buffer.push(card.cost);
				}
				Network.send(connection, buffer);
				
				// send creature data dump
				buffer = [NetProtocol.client.DATADUMP_CREATURE];
				for(const id_creature in Data.creatures)
				{
					const creature = Data.creatures[id_creature];
					
					BufferWriter.string(buffer, creature._id);
					BufferWriter.string(buffer, creature.name);
					buffer.push(creature.attack);
					buffer.push(creature.health);
				}
				Network.send(connection, buffer);
				
				for(let j = 0; j < games.length; ++j)
				{
					const game = games[j];
					
					if(game.connections[0].player._id === player._id)
					{
						const buffer_gamestart = [NetProtocol.client.GAMESTART];
						BufferWriter.string(buffer_gamestart, game.connections[1].player._id);
						Network.send(connection, buffer_gamestart);
						
						Network.send(connection, [NetProtocol.client.GAME, NetProtocol.client.game.STATE].concat(game.encodestate(0)));
						
						if(game.state.index_currentplayer === 0)
							Network.send(connection, [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_PLAYER]);
						
						connection.game = game;
					}
					else if(game.connections[1].player._id === player._id)
					{
						const buffer_gamestart = [NetProtocol.client.GAMESTART];
						BufferWriter.string(buffer_gamestart, game.connections[0].player._id);
						Network.send(connection, buffer_gamestart);
						
						Network.send(connection, [NetProtocol.client.GAME, NetProtocol.client.game.STATE].concat(game.encodestate(1)));
						
						if(game.state.index_currentplayer === 1)
							Network.send(connection, [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_PLAYER]);
						
						connection.game = game;
					}
				}
				
				return;
			}
		}
		
		request.reject();
	});
});