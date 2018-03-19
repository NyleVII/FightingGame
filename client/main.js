// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";


// network/state message handler
const processes =
[
	// 0x00 Chat message
	function(reader)
	{
		const id_player = reader.read_string();
		const text = reader.read_string();
		
		DOMRenderer.addchat(Data.players[id_player].name, text);
	},
	
	// 0x01 ability data dump
	function(reader)
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
	},
	
	// 0x02 card data dump
	function(reader)
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
	},
	
	// 0x03 creature data dump
	function(reader)
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
	},
	
	// 0x04 full player list
	function(reader)
	{
		Data.players = {};
		while(reader.index < reader.dataview.byteLength)
		{
			const id_player = reader.read_string();
			const name = reader.read_string();
			
			Data.players[id_player] = {name: name};
		}
		
		DOMRenderer.playerlist();
	},
	
	// 0x05 player joined
	function(reader)
	{
		const id_player = reader.read_string();
		Data.players[id_player] = {name: reader.read_string()};
		
		DOMRenderer.addmessage(Data.players[id_player].name + " joined the server.");
		
		DOMRenderer.playerlist();
	},
	
	// 0x06 player left
	function(reader)
	{
		const id_player = reader.read_string();
		
		DOMRenderer.addmessage(Data.players[id_player].name + " left the server.");
		delete Data.players[id_player];
		
		DOMRenderer.playerlist();
	},
	
	// 0x07 successful login
	function(reader)
	{
		State.id_player_self = reader.read_string();
		DOMRenderer.usertext("Welcome " + Data.players[State.id_player_self].name);
	},

	// 0x08 invalid deck
	function()
	{
		console.log("Invalid deck");
		// TODO(shawn): handle invalid deck error
	},

	// 0x09 game started
	function(reader)
	{
		const id_opponent = reader.read_string();
		
		console.log("game starting");
		
		DOMRenderer.gamescreen_show();
		State.game = new Game(DOMRenderer.gamerenderer, Data.players[id_opponent]);
		State.game.render();
	},

	// 0x0A game state
	function(reader)
	{
		const state = {
			player: {
				creatures: [],
				hand: [],
			},
			opponent: {
				creatures: [],
			}
		};
		
		// player state
		state.player.energy_max = reader.read_int8();
		state.player.energy_current = reader.read_int8();
		state.player.deckSize = reader.read_int8();

		// player creatures
		for(let i = 0; i < 3; ++i)
		{
			const creature = {effects: []};
			
			creature.id = reader.read_string();
			creature.health = reader.read_int8();
			
			creature.id_ability = reader.read_string();
			
			const len_effects = reader.read_int8();
			for(let j = 0; j < len_effects; ++j)
				creature.effects.push(reader.read_string());

			state.player.creatures.push(creature);
		}

		// player hand
		const len_hand = reader.read_int8();
		for(let i = 0; i < len_hand; ++i)
			state.player.hand.push(reader.read_string());
		
		// opponent state
		state.opponent.energy_max = reader.read_int8();
		state.opponent.energy_current = reader.read_int8();
		state.opponent.deckSize = reader.read_int8();

		// opponent creatures
		for(let i = 0; i < 3; ++i)
		{
			const creature = {effects: []};
			
			creature.id = reader.read_string();
			creature.health = reader.read_int8();
			
			creature.id_ability = reader.read_string();
			
			const len_effects = reader.read_int8();
			for(let j = 0; j < len_effects; ++j)
				creature.effects.push(reader.read_string());

			state.opponent.creatures.push(creature);
		}

		// opponent hand
		state.opponent.handSize = reader.read_int8();

		// game state
		state.is_opponents_turn = reader.read_int8(); //0 (false) means it's my turn, 1 opponents
		state.turn = reader.read_int8();

		//Set the state game state to...the uhh...game state >_>
		State.game.state_set(state);
	},

	// 0x0B your turn
	function()
	{
		console.log("It's your turn");
		// TODO(shawn): notify player it is their turn
	},

	// 0x0C not in a game
	function()
	{
		console.log("Not in a game");
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
		console.log("Already in queue");
		// TODO(shawn): handle already in queue error
	},

	// 0x0F not in queue
	function()
	{
		console.log("Not in queue");
		// TODO(shawn): handle not in queue error
	},

	// 0x10 left queue
	function()
	{
		State.queued = false;
		document.getElementById("queueButton").innerText = "Queue";
	},

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
	},

	// 0x14 not your turn
	function()
	{
		console.log("It is not your turn");
	}
];

// socket message handler
socket.onmessage = function(event)
{
	const reader = new DataReader(new DataView(event.data));
	const code = reader.read_int8();
	
	const process = processes[code];
	if(process !== undefined)
		process(reader);
};