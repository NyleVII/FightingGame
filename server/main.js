const websocket = require("websocket");
const server_http = require("./http.js");
const BufferWriter = require("./bufferwriter.js");
const Config = require("../appconfig.json");
const Data = require("./data.js");
const Game = require("./game/game.js");
const Log = require("./log.js");
const NetProtocol = require("../netprotocol.json");
const Network = require("./network.js");
const Random = require("./random.js");


const LEN_CONNECTIONID = 20;


// global variables
const State = {
	connections: {}, // dictionary of connection id to connection instance
	players: {
		by_id: {}, // dictionary of player id to player instance for all logged in players
		by_name: {} // dictionary of player name to player instance for all logged in players
	},
	queue: {}, // dictionary of player id to player instance for all players in queue
	len_queue: 0, // number of players in queue
	games: [] // list of currently running games
};


// initialize web server
server_http.listen(Config.app_port);
const server_websocket = new websocket.server({httpServer: server_http});

Data.initialize();

function broadcast(message)
{
	for(const id_player in State.players.by_id)
		State.players.by_id[id_player].connection.sendUTF(message);
}

function errormessage(errorcode)
{
	return JSON.stringify({
		code: NetProtocol.client.ERROR,
		error: {
			code: errorcode
		}
	});
}


const processes = {};

processes[NetProtocol.server.LOGIN] = function(connection, payload)
{
	if(State.players.by_name[payload.name] !== undefined)
		connection.sendUTF(JSON.stringify({
			code: NetProtocol.client.ERROR,
			error: {
				code: NetProtocol.client.error.ALREADY_LOGGED_IN
			}
		}));
	else
		Data.collections.players.findOne({name: payload.name}, function(error, player)
		{
			if(error !== null)
				Log.error(error, "logging in");
			else if(player === null)
				connection.sendUTF(JSON.stringify({
					code: NetProtocol.client.ERROR,
					error: {
						code: NetProtocol.client.error.PLAYER_NOT_FOUND
					}
				}));
			else
			{
				// update player state
				State.players.by_id[player._id] = State.players.by_name[player.name] = connection.player = player;
				player.connection = connection;

				// TODO(shawn): send friend's list

				// send login success message
				connection.sendUTF(JSON.stringify({
					code: NetProtocol.client.LOGIN,
					id: player._id
				}));

				// TODO(shawn): send player join message to friends

				Log.message(`${player.name} connected.`);

				// send data dumps
				Network.send(connection, Data.buffers.abilities);
				Network.send(connection, Data.buffers.cards);
				Network.send(connection, Data.buffers.creatures);

				// check if player should reconnect to an existing game
				let index_game;
				for(index_game = 0; index_game < State.games.length; ++index_game)
				{
					const game = State.games[index_game];

					const index_player = game.id_players.indexOf(player._id);
					if(index_player !== -1)
					{
						connection.sendUTF(JSON.stringify({
							code: NetProtocol.client.GAMESTART,
							id_player_opponent: game.id_players[index_player ^ 1]
						}));

						connection.sendUTF(JSON.stringify({
							code: NetProtocol.client.GAME,
							game: {
								code: NetProtocol.client.game.STATE,
								state: game.encodestate(index_player)
							}
						}));

						if(game.state.index_currentplayer === index_player)
							connection.sendUTF(JSON.stringify({
								code: NetProtocol.client.GAME,
								game: {
									code: NetProtocol.client.game.TURN_START_PLAYER
								}
							}));

						player.game = game;
						game.players[index_player] = player;
					}
				}

				if(index_game === State.games.length)
					player.game = null;
			}
		});
};

function logout(connection)
{
	delete State.players.by_id[connection.player._id];
	delete State.players.by_name[connection.player.name];

	if(State.queue[connection.player._id] !== undefined)
	{
		delete State.queue[connection.player._id];
		State.len_queue--;
	}

	if(connection.player.game !== null)
	{
		const game = connection.player.game;
		const index_player = game.players.indexOf(connection.player);
		game.players[index_player] = null;
	}

	connection.player = null;
}

processes[NetProtocol.server.LOGOUT] = function(connection)
{
	logout(connection);
	connection.sendUTF(JSON.stringify({code: NetProtocol.client.LOGOUT}));
};

processes[NetProtocol.server.CHAT] = function(connection, payload)
{
	// // TODO(shawn):

	// .sendUTF(JSON.stringify({
	// 	code: NetProtocol.client.CHAT,
	// 	id_player: payload.id_player,
	// 	message: payload.message
	// }));

	// const buffer = [NetProtocol.client.CHAT];

	// BufferWriter.string(buffer, connection.player._id);
	// for(let index_character = 1; index_character < buffer_process.length; ++index_character)
	// 	buffer.push(buffer_process.readUInt8(index_character));
	
	// broadcast(Buffer.from(buffer));
};

processes[NetProtocol.server.QUEUE_JOIN] = function(connection)
{
	if (State.queue[connection.player._id])
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.ALREADY_IN_QUEUE]);
	else
	{
		Network.send(connection, [NetProtocol.client.QUEUE_JOINED]);

		// NOTE(shawn): temporary; implement matchmaking
		if(State.len_queue > 0)
		{
			// get first player in queue
			let id_opponent, opponent;
			for(id_opponent in State.queue)
			{
				opponent = State.queue[id_opponent];
				break;
			}

			// create new game
			const game = connection.player.game = opponent.game = new Game(connection.player, opponent);
			State.games.push(game);
			game.listen("defeat", {
				notify: function(params)
				{
					Log.message("Game complete", params);

					game.players[0].game = null;
					game.players[1].game = null;
					State.games.splice(State.games.indexOf(game), 1);
				}
			});

			delete State.queue[id_opponent];
			State.len_queue--;
		}
		else
		{
			State.queue[connection.player._id] = connection.player;
			State.len_queue++;
		}
	}
};

processes[NetProtocol.server.QUEUE_LEAVE] = function(connection)
{
	if(State.queue[connection.player._id] === undefined)
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.NOT_IN_QUEUE]);
	else
	{
		delete State.queue[connection.player._id];
		State.len_queue--;

		Network.send(connection, [NetProtocol.client.QUEUE_LEFT]);
	}
};

processes[NetProtocol.server.LOADOUT_ACTIVE] = function(connection, buffer_process)
{
	const id_loadout = read_string(buffer_process, 1);

	// TODO(shawn): actually make the loadout active
	Data.collections.loadouts.findOne({_id: id_loadout, id_player: connection.player._id}, function(error, loadout)
	{
		if(error !== null)
			Log.error(error, "activating loadout");
		else if(loadout === null)
			Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.INVALID_LOADOUT]);
		else
			Network.send(connection, [NetProtocol.client.LOADOUT_ACTIVE]);
	});
};

processes[NetProtocol.server.GAME] = function(connection, buffer_process)
{
	const game = connection.player.game;

	if(game === null)
		Network.send(connection, [NetProtocol.client.ERROR, NetProtocol.client.error.NOT_IN_GAME]);
	else
		game.process(game.players.indexOf(connection.player), buffer_process);
};


server_websocket.on("request", function(request)
{
	if(Data.db === null)
		request.reject();
	else
	{
		const connection = request.accept(null, request.origin);
		connection.id = Random.identifier(LEN_CONNECTIONID);
		connection.player = null;
		State.connections[connection.id] = connection;

		connection.on("close", function()
		{
			delete State.connections[connection.id];

			if(connection.player !== null)
			{
				const player = connection.player;

				logout(connection);

				// broadcast player left message TODO(shawn): make this only online friends
				broadcast(JSON.stringify({
					code: NetProtocol.client.PLAYER_LEFT,
					id: player._id
				}));
				Log.message(`${player.name} disconnected.`);
			}
		});

		connection.on("message", function(message)
		{
			try
			{
				const payload = JSON.parse(message.utf8Data);
				let process;

				if(connection.player === null && payload.code !== NetProtocol.server.LOGIN)
					connection.sendUTF(JSON.stringify({
						code: NetProtocol.client.ERROR,
						error: {
							code: NetProtocol.client.error.NOT_LOGGED_IN
						}
					}));
				else if((process = processes[payload.code]) === undefined)
					connection.sendUTF(JSON.stringify({
						code: NetProtocol.client.ERROR,
						error: {
							code: NetProtocol.client.error.INVALID_MESSAGE
						}
					}));
				else
					process(connection, payload);
			}
			catch(error)
			{
				connection.sendUTF(JSON.stringify({
					code: NetProtocol.client.ERROR,
					error: {
						code: NetProtocol.client.error.INVALID_MESSAGE
					}
				}));
			}
		});
	}
});