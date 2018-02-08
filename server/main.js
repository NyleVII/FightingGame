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
	const buffer_players = [0x04];
	for(let i = 0; i < connections.length; ++i)
	{
		const alias = connections[i].alias;
		
		for(let j = 0; j < alias.length; ++j)
			buffer_players.push(alias.charCodeAt(j) & 0xff);
		buffer_players.push(0x00);
	}
	
	for(let i = 0; i < connections.length; ++i)
		connections[i].send(Buffer.from(buffer_players));
}


const processes =
{
	chat: function(connection, params)
	{
		for(const i in connections)
			connections[i].send("chat " + connections.indexOf(connection) + " " + params);
	}
};


server_websocket.on("request", function(request)
{
	if(connections.length < MAX_CONNECTIONS)
	{
		const connection = request.accept(null, request.origin);
		const id_player = connections.length;
		connections.push(connection);
		
		// send ability data dump
		const buffer_abilities = [0x01];
		for(let i = 0; i < global.data.abilities.length; ++i)
		{
			const ability = global.data.abilities[i];
			
			// ability id
			for(let j = 0; j < ability._id.length; ++j)
				buffer_abilities.push(ability._id.charCodeAt(j) & 0xff);
			buffer_abilities.push(0x00);
			
			// ability name
			for(let j = 0; j < ability.name.length; ++j)
				buffer_abilities.push(ability.name.charCodeAt(j) & 0xff);
			buffer_abilities.push(0x00);
		}
		connection.sendBytes(Buffer.from(buffer_abilities));
		
		// send card data dump
		const buffer_cards = [0x02];
		for(let i = 0; i < global.data.cards.length; ++i)
		{
			const card = global.data.cards[i];
			
			// card id
			for(let j = 0; j < card._id.length; ++j)
				buffer_cards.push(card._id.charCodeAt(j) & 0xff);
			buffer_cards.push(0x00);
			
			// card name
			for(let j = 0; j < card.name.length; ++j)
				buffer_cards.push(card.name.charCodeAt(j) & 0xff);
			buffer_cards.push(0x00);
			
			// card cost
			buffer_cards.push(card.cost);
		}
		connection.sendBytes(Buffer.from(buffer_cards));
		
		// send creature data dump
		const buffer_creatures = [0x03];
		for(let i = 0; i < global.data.creatures.length; ++i)
		{
			const creature = global.data.creatures[i];
			
			// creature id
			for(let j = 0; j < creature._id.length; ++j)
				buffer_creatures.push(creature._id.charCodeAt(j) & 0xff);
			buffer_creatures.push(0x00);
			
			// creature name
			for(let j = 0; j < creature.name.length; ++j)
				buffer_creatures.push(creature.name.charCodeAt(j) & 0xff);
			buffer_creatures.push(0x00);
		}
		connection.sendBytes(Buffer.from(buffer_creatures));
		
		
		alias_set(id_player, "player_" + Math.floor(Math.random()*10000));
		
		broadcast_players();
		
		// TEMP(shawn): create game when one player connects
		if(connections.length === 1)
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
			const buffer = message.binaryData;
			
			const process = processes[buffer.readUInt8(0)]
			if(process !== undefined)
				process(buffer);
			
			/*
			const input = message.utf8Data;
			const sep = input.indexOf(" ");
			
			let type, params;
			if(sep === -1)
			{
				type = input;
				params = "";
			}
			else
			{
				type = input.slice(0, sep);
				params = input.slice(sep + 1);
			}
			
			if(processes[type] !== undefined)
				processes[type](connection, params);
			*/
		});
	}
	else
		request.reject();
});