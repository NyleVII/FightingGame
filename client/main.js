// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";


function read_string(dataview, index)
{
	let char, string = "";
	
	while(index < dataview.byteLength && (char = dataview.getInt8(index++)))
		string += String.fromCharCode(char);
	
	return string;
}


// network/state message handler
const processes =
[
	// 0x00 Chat message
	function(dataview)
	{
		const id_player = read_string(dataview, 1);
		const text = read_string(dataview, id_player.length + 2);
		
		DOMRenderer.addchat(Data.players[id_player].name, text);
	},
	
	// 0x01 ability data dump
	function()
	{
		// TODO(shawn): load ability data
	},
	
	// 0x02 card data dump
	function(dataview)
	{
		let index = 1;
		
		Data.cards.by_id = {};
		Data.cards.by_name = {};
		while(index < dataview.byteLength)
		{
			const id_card = read_string(dataview, index);
			index += id_card.length + 1;
			
			const name = read_string(dataview, index);
			index += name.length + 1;
			
			const cost = dataview.getInt8(index++);
			
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
			// TODO(shawn): do something once card assets are loaded
		});
	},
	
	// 0x03 creature data dump
	function(dataview)
	{
		let index = 1;
		
		Data.creatures.by_id = {};
		Data.creatures.by_name = {};
		while(index < dataview.byteLength)
		{
			const id_creature = read_string(dataview, index);
			index += id_creature.length + 1;
			
			const name = read_string(dataview, index);
			index += name.length + 1;
			
			const attack = dataview.getInt8(index++);
			const health = dataview.getInt8(index++);
			
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
			// TODO(shawn): do something once creature assets are loaded
		});
	},
	
	// 0x04 full player list
	function(dataview)
	{
		let index = 1;
		
		Data.players = {};
		while(index < dataview.byteLength)
		{
			const id_player = read_string(dataview, index);
			index += id_player.length + 1;
			
			const name = read_string(dataview, index);
			index += name.length + 1;
			
			Data.players[id_player] = {name: name};
		}
		
		DOMRenderer.playerlist();
	},
	
	// 0x05 player joined
	function(dataview)
	{
		const id_player = read_string(dataview, 1);
		Data.players[id_player] = {name: read_string(dataview, id_player.length + 2)};
		
		DOMRenderer.addmessage(Data.players[id_player].name + " joined the server.");
		
		DOMRenderer.playerlist();
	},
	
	// 0x06 player left
	function(dataview)
	{
		const id_player = read_string(dataview, 1);
		
		DOMRenderer.addmessage(Data.players[id_player].name + " left the server.");
		delete Data.players[id_player];
		
		DOMRenderer.playerlist();
	},
	
	// 0x07 successful login
	function(dataview)
	{
		State.id_player_self = read_string(dataview, 1);
		DOMRenderer.usertext("Welcome " + Data.players[State.id_player_self].name);
	},

	// 0x08 invalid deck
	function()
	{
		// TODO(shawn): handle invalid deck error
	},

	// 0x09 game started
	function(dataview)
	{
		DOMRenderer.gamescreen_show();
		const id_player = read_string(dataview, 1);
		game = new Game(renderer, Data.players[id_player]);
	},

	// 0x0A game state
	function()
	{
		// TODO(shawn): update game state
	},

	// 0x0B your turn
	function()
	{
		// TODO(shawn): notify player it is their turn
	},

	// 0x0C not in a game
	function()
	{
		// TODO(shawn): handle not in game error
	},

	// 0x0D successfully queued
	function()
	{
		State.queued = true;
		document.getElementById("queueButton").innerText = "In Queue";
	},

	// 0x0E already in queue
	function()
	{
		// TODO(shawn): handle already in queue error
	},

	// 0x0F not in queue
	function()
	{
		// TODO(shawn): handle not in queue error
	},

	// 0x10 left queue
	function()
	{
		State.queued = false;
		document.getElementById("queueButton").innerText = "Queue";
	},

	// 0x11 game over
	function(dataview)
	{
		// TODO(shawn): better game over handling
		DOMRenderer.gamescreen_hide();
		
		if(dataview.getInt8(1))
			console.log("A loser is you!");
		else
			console.log("Winner winner chicken dinner");
	},

	// 0x12 play card
	function(dataview)
	{
		// TODO(shawn): animations, sound effects, update game state
		const playedCardID = read_string(dataview, 1);
		console.log(Data.cards.by_id[playedCardID].name); //Prints name of played card
	},

	// 0x13 use ability
	function(dataview)
	{
		// TODO(shawn): animations, sound effects, update game state
		const index_creature = dataview.getInt8(1);
		const index_ability = dataview.getInt8(2);
		
		const id_creature = game.state.opponent.creatures[index_creature].id;
		
		console.log("Your opponents " + Data.creatures.by_id[id_creature].name + " used...an ability with some kind of ID");
	}
];

// socket message handler
socket.onmessage = function(event)
{
	const dataview = new DataView(event.data);
	const code = dataview.getInt8(0);
	
	const process = processes[code];
	if(process !== undefined)
		process(dataview);
};