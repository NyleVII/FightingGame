// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";


// network/state message handler
const processes = {};

processes[NetProtocol.client.LOGIN] = function(reader)
{
	State.id_player_self = reader.read_string();
	DOMRenderer.usertext("Welcome " + Data.players[State.id_player_self].name);
};

processes[NetProtocol.client.CHAT] = function(reader)
{
	const id_player = reader.read_string();
	const text = reader.read_string();
	
	DOMRenderer.addchat(Data.players[id_player].name, text);
};

processes[NetProtocol.client.DATADUMP_ABILITY] = function(reader)
{
	Data.abilities.by_id = {};
	Data.abilities.by_name = {};
	while(reader.index < reader.dataview.byteLength)
	{
		const id_ability = reader.read_string();
		const name = reader.read_string();
		const cost = reader.read_int8();
		
		Data.abilities.by_id[id_ability] = Data.abilities.by_name[name] = {
			id: id_ability,
			name: name,
			cost: cost
		};
	}
};

processes[NetProtocol.client.DATADUMP_CREATURE] = function(reader)
{
	Data.creatures.by_id = {};
	Data.creatures.by_name = {};
	while(reader.index < reader.dataview.byteLength)
	{
		const id_creature = reader.read_string();
		const name = reader.read_string();
		const attack = reader.read_int8();
		const health = reader.read_int8();
		
		Data.creatures.by_id[id_creature] = Data.creatures.by_name[name] = {
			id: id_creature,
			name: name,
			attack: attack,
			health: health
		};
	}
	
	const assets = [];
	for(const id_creature in Data.creatures.by_id)
		assets.push({
			name: id_creature + "_creature",
			url: "assets/images/creatures/" + id_creature + ".png"
		});
	
	PIXI.loader.add(assets).load(function()
	{
		State.loaded.assets_creatures = true;
		State.loaded_process();
	});
};

processes[NetProtocol.client.DATADUMP_CARD] = function(reader)
{
	Data.cards.by_id = {};
	Data.cards.by_name = {};
	while(reader.index < reader.dataview.byteLength)
	{
		const id_card = reader.read_string();
		const name = reader.read_string();
		const cost = reader.read_int8();
		
		Data.cards.by_id[id_card] = Data.cards.by_name[name] = {
			id: id_card,
			name: name,
			cost: cost
		};
	}
	
	const assets = [];
	for(const id_card in Data.cards.by_id)
		assets.push({
			name: id_card + "_card",
			url: "assets/images/cards/" + id_card + ".png"
		});
	
	PIXI.loader.add(assets).load(function()
	{
		State.loaded.assets_cards = true;
		State.loaded_process();
	});
};

processes[NetProtocol.client.PLAYER_LIST] = function(reader)
{
	Data.players = {};
	while(reader.index < reader.dataview.byteLength)
	{
		const id_player = reader.read_string();
		const name = reader.read_string();
		
		Data.players[id_player] = {name: name};
	}
	
	DOMRenderer.playerlist();
};

processes[NetProtocol.client.PLAYER_JOINED] = function(reader)
{
	const id_player = reader.read_string();
	Data.players[id_player] = {name: reader.read_string()};
	
	DOMRenderer.addmessage(Data.players[id_player].name + " joined the server.");
	
	DOMRenderer.playerlist();
};

processes[NetProtocol.client.PLAYER_LEFT] = function(reader)
{
	const id_player = reader.read_string();
	
	DOMRenderer.addmessage(Data.players[id_player].name + " left the server.");
	delete Data.players[id_player];
	
	DOMRenderer.playerlist();
};

processes[NetProtocol.client.QUEUE_JOINED] = function()
{
	State.queued = true;
	document.getElementById("queueButton").innerText = "In Queue";
};

processes[NetProtocol.client.QUEUE_LEFT] = function()
{
	State.queued = false;
	document.getElementById("queueButton").innerText = "Queue";
};

processes[NetProtocol.client.GAMESTART] = function(reader)
{
	const id_opponent = reader.read_string();
	
	DOMRenderer.gamescreen_show();
	State.game = new Game(DOMRenderer.gamerenderer, Data.players[id_opponent]);
	State.game.render();
};

processes[NetProtocol.client.GAME] = function(reader)
{
	if(State.game === undefined)
		console.error("Should be in-game");
	else
		State.game.process(reader);
};

processes[NetProtocol.client.ERROR] = function()
{
	console.error("An error occurred but I'm too lazy to print out what it is.");
};

/*
const processes =
[
	// 0x11 game over
	function(reader)
	{
		// TODO(shawn): better game over handling
		DOMRenderer.gamescreen_hide();
		
		if(reader.read_int8())
			console.log("A loser is you!");
		else
			console.log("Winner winner chicken dinner");
	},

	// 0x12 play card
	function(reader)
	{
		// TODO(shawn): animations, sound effects, update game state
		const id_card = reader.read_string();
		console.log(Data.cards.by_id[id_card].name);
	},

	// 0x13 use ability
	function(reader)
	{
		// TODO(shawn): animations, sound effects, update game state
		const index_creature = reader.read_int8();
		const index_ability = reader.read_int8();
		
		const creature = State.game.state.creatures[index_creature];
		const id_ability = creature.abilities[index_ability];
		
		console.log("Your opponent's " + Data.creatures.by_id[creature.id].name + " used " + Data.abilities.by_id[id_ability].name + ".");
	}
];
*/

// socket message handler
socket.onmessage = function(event)
{
	const reader = new DataReader(new DataView(event.data));
	const code = reader.read_int8();
	
	const process = processes[code];
	if(process !== undefined)
		process(reader);
};