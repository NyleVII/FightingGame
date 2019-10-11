// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";


// network/state message handler
const processes = {};

processes[NetProtocol.client.LOGIN] = function(reader)
{
	State.id_player_self = reader.read_string();
};

processes[NetProtocol.client.LOGOUT] = function()
{
	State.id_player_self = "";
	State.queued = false;
	State.game = null;
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
		const health = reader.read_int8();

		Data.creatures.by_id[id_creature] = Data.creatures.by_name[name] = {
			id: id_creature,
			name: name,
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
		const text = reader.read_string();

		Data.cards.by_id[id_card] = Data.cards.by_name[name] = {
			id: id_card,
			name: name,
			cost: cost,
			text: text
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

	State.game = new Game(DOMRenderer.gamerenderer, Data.players[id_opponent]);
	State.game.render();
	State.queued = false;
};

processes[NetProtocol.client.GAME] = function(reader)
{
	if(State.game === null)
		Log.error("Should be in-game");
	else
		State.game.process(reader);
};

processes[NetProtocol.client.ERROR] = function(reader)
{
	const code = reader.read_uint8();
	for(const key in NetProtocol.client.error)
		if(NetProtocol.client.error[key] === code)
		{
			Log.error("An error occurred: " + key);
			break;
		}
};

// socket message handler
socket.onmessage = function(event)
{
	const reader = new DataReader(new DataView(event.data));
	const code = reader.read_uint8();

	const process = processes[code];
	if(process !== undefined)
		process(reader);
};


// start loading miscellaneous game assets
PIXI.loader.add([
	{name: "energy", url:"assets/images/energy.png"},
	{name: "deck", url:"assets/images/deck.png"},
	{name: "cardback", url:"assets/images/cardback.png"},
	{name: "ability_box", url:"assets/images/ability_box.png"},
	{name: "end_turn", url:"assets/images/end_turn.png"}
]).load(function()
{
	State.loaded.assets_misc = true;
	State.loaded_process();
});

// assign initialize routine callback
document.addEventListener("DOMContentLoaded", DOMRenderer.initialize);

DOMRenderer.update_friendslist();