const MAX_EFFECTHANDSIZE = 8;
const ANCHOR_EFFECTHAND_PLAYER = {x: 400, y: 600};
const ANCHOR_EFFECTHAND_OPPONENT = {x: 0, y: 0};
const INCREMENT_EFFECTHAND_PLAYER = {x: 45, y: 0};
const INCREMENT_EFFECTHAND_OPPONENT = {x: 45, y: 0}; //OPPONENT HAND GROWS TO THE LEFT
const CREATURE_SPACING = 110;
const SIZE_CARD = {x: 75, y: 100};

let counter_mouseover = 0;

//init_sprite(<stage>, num, num, num, num, num, num, num, boolean, function)
function init_sprite(stage, x, y, x_anchor, y_anchor, width, height, scale_x, interactive, onClick, onHover, onMouseout)
{
	const sprite = new PIXI.Sprite();
	
	sprite.anchor.set(x_anchor, y_anchor);
	sprite.width = width;
	sprite.height = height;
	sprite.x = x;
	sprite.y = y;
	sprite.scale.x = scale_x;
	sprite.interactive = interactive;
	sprite.buttonMode = interactive;
	if(interactive)
	{
		sprite.on("click", onClick);
		sprite.on("mouseover", onHover);
		sprite.on("mouseout", onMouseout);
	}
	
	stage.addChild(sprite);
	
	return sprite;
}

function init_text(stage, x, y, x_anchor, y_anchor)
{
	const text = new PIXI.Text("", new PIXI.TextStyle({fill: "white"}));
	
	text.x = x;
	text.y = y;
	text.anchor.set(x_anchor, y_anchor);
	stage.addChild(text);
	
	return text;
}

function Game(renderer, opponent)
{
	const game = this;
	
	function onClick_creature(event)
	{
		let target;
		if(event.target.is_mine)
		{
			target = State.game.state.player.creatures[event.target.creature_index];
		}
		else
		{
			target = State.game.state.opponent.creatures[event.target.creature_index];
		}
		game.text_command_card.text = "Clicked on " + Data.creatures.by_id[target.id].name;
		game.render();
	}

	function onHover_creature(event)
	{
		let target;
		if(event.target.is_mine)
		{
			target = State.game.state.player.creatures[event.target.creature_index];
		}
		else
		{
			target = State.game.state.opponent.creatures[event.target.creature_index];
		}
		game.text_command_card.text = "Hovering over " + Data.creatures.by_id[target.id].name;

		game.render();
	}

	function onClick_card(event)
	{
		//Sends play card message to the server
		socket.send(new Uint8Array([NetProtocol.server.GAME, NetProtocol.server.game.PLAY_CARD, event.target.card_index]));
		onMouseout_card();
	}

	function onHover_card(event)
	{
		console.log("In onHover_card");

		counter_mouseover++; //Increment variable to track hover events so onMouseout doesn't trigger before we want
		const id_card = State.game.state.player.hand[event.target.card_index];
		
		//Update command card text
		game.text_command_card.text = "Hovering over " + Data.cards.by_id[id_card].name;

		//Update card preview sprite on hover
		game.sprite_card_hover.texture = PIXI.loader.resources[id_card + "_card"].texture;
		game.sprite_card_hover.x = game.sprite_player_hand[event.target.card_index].x;
		game.render();
	}

	function onMouseout_card(event)
	{
		console.log("In onMouseout_card");
		counter_mouseover--;
		if(counter_mouseover <= 0)
		{			
			counter_mouseover = 0;
			//Update command card text
			game.text_command_card.text = "";

			//Update card preview sprite on hover
			game.sprite_card_hover.texture = PIXI.Texture.EMPTY;
			game.render();
		}
		
	}
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();

	//TEMPORARY
	//Graphics to draw grid lines to double check spacing
	this.graphics = new PIXI.Graphics();
	this.graphics.lineStyle(2, 0xffffff, 1);
	this.graphics.moveTo(0, 300);
	this.graphics.lineTo(800, 300);
	this.graphics.moveTo(400, 0);
	this.graphics.lineTo(400, 600);
	this.stage.addChild(this.graphics);

	//Draws command card rectangle
	//Used for creature ability selection
	this.graphics.drawRect(20, 380, 310, 150);
	this.text_command_card = init_text(this.stage, 20, 380, 0, 0);
	this.text_command_card.text = "TEST";
	this.stage.addChild(this.graphics);

	//Draw creature ability rectangle
	this.graphics.beginFill(0xFF0000); //Red
	this.sprite_ability_box = init_sprite(this.stage, 400, 300, 0.5, 1, 100, 50, 1, true, function(){/*onClick*/}, function(){/*onHover*/});

	
	//End Turn Button
	this.sprite_end_turn_button = init_sprite(this.stage, 800, 350, 1, 0.5, 120, 50, 1, true, function(){socket.send(new Uint8Array([NetProtocol.server.GAME, NetProtocol.server.game.ENDTURN]));}, function(){/*onHover*/});
	this.end_turn_text = init_text(this.stage, this.sprite_end_turn_button.x - this.sprite_end_turn_button._width/2, this.sprite_end_turn_button.y, 0.5, 0.5);
	this.end_turn_text.text = "End Turn";
	
	
	// add player creature sprites to game screen
	this.sprite_player_creature_pos0 = init_sprite(this.stage, CREATURE_SPACING*2, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos0.creature_index = 0;
	this.sprite_player_creature_pos0.is_mine = true;
	this.text_player_creature_health_pos0 = init_text(this.stage, this.sprite_player_creature_pos0.x + this.sprite_player_creature_pos0._width/2, this.sprite_player_creature_pos0.y, 0.5, 0);
	this.sprite_player_creature_pos1 = init_sprite(this.stage, CREATURE_SPACING, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos1.creature_index = 1;
	this.sprite_player_creature_pos1.is_mine = true;
	this.text_player_creature_health_pos1 = init_text(this.stage, this.sprite_player_creature_pos1.x + this.sprite_player_creature_pos1._width/2, this.sprite_player_creature_pos1.y, 0.5, 0);
	this.sprite_player_creature_pos2 = init_sprite(this.stage, 0, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos2.creature_index = 2;
	this.sprite_player_creature_pos2.is_mine = true;
	this.text_player_creature_health_pos2 = init_text(this.stage, this.sprite_player_creature_pos2.x + this.sprite_player_creature_pos2._width/2, this.sprite_player_creature_pos2.y, 0.5, 0);
	
	// add opponent creature sprites to game screen
	this.sprite_opponent_creature_pos0 = init_sprite(this.stage, renderer.width - CREATURE_SPACING*2, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos0.creature_index = 0;
	this.sprite_opponent_creature_pos0.is_mine = false;
	this.text_opponent_creature_health_pos0 = init_text(this.stage, this.sprite_opponent_creature_pos0.x - this.sprite_opponent_creature_pos0._width/2, this.sprite_opponent_creature_pos0.y, 0.5, 0);
	this.sprite_opponent_creature_pos1 = init_sprite(this.stage, renderer.width - CREATURE_SPACING, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos1.creature_index = 1;
	this.sprite_opponent_creature_pos1.is_mine = false;
	this.text_opponent_creature_health_pos1 = init_text(this.stage, this.sprite_opponent_creature_pos1.x - this.sprite_opponent_creature_pos1._width/2, this.sprite_opponent_creature_pos1.y, 0.5, 0);
	this.sprite_opponent_creature_pos2 = init_sprite(this.stage, renderer.width, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos2.creature_index = 2;
	this.sprite_opponent_creature_pos2.is_mine = false;
	this.text_opponent_creature_health_pos2 = init_text(this.stage, this.sprite_opponent_creature_pos2.x - this.sprite_opponent_creature_pos2._width/2, this.sprite_opponent_creature_pos2.y, 0.5, 0);

	// player deck and energy info sprites
	this.sprite_player_deck = init_sprite(this.stage, 200, renderer.height, 0, 1, 50, 50, 1, false);
	this.sprite_player_energy = init_sprite(this.stage, 280, renderer.height, 0, 1, 50, 50, 1, false);
	
	// player info text
	this.text_player_deck = init_text(this.stage, this.sprite_player_deck.x + this.sprite_player_deck._width, this.sprite_player_deck.y - this.sprite_player_deck._height/2, 0, 0.5);
	this.text_player_energy = init_text(this.stage, this.sprite_player_energy.x + this.sprite_player_energy._width, this.sprite_player_energy.y - this.sprite_player_energy._height/2, 0, 0.5);
	this.text_player_name = init_text(this.stage, 20, renderer.height - this.sprite_player_energy._height/2, 0, 0.5);
	this.text_player_name.text = Data.players[State.id_player_self].name;
	
	// opponent info sprites
	this.sprite_opponent_deck = init_sprite(this.stage, 520, 0, 0, 0, 50, 50, 1, false);
	this.sprite_opponent_energy = init_sprite(this.stage, renderer.width/2, 0, 0, 0, 50, 50, 1, false);
	
	// opponent info text
	this.text_opponent_deck = init_text(this.stage, this.sprite_opponent_deck.x + this.sprite_opponent_deck._width, this.sprite_opponent_deck.y + this.sprite_opponent_deck._height/2, 0, 0.5);
	this.text_opponent_energy = init_text(this.stage, this.sprite_opponent_energy.x + this.sprite_opponent_energy._width, this.sprite_opponent_energy.y + this.sprite_opponent_energy._height/2, 0, 0.5);
	this.text_opponent_name = init_text(this.stage, renderer.width - 20, 25, 1, 0.5);
	this.text_opponent_name.text = opponent.name;

	// hand card sprites
	this.sprite_player_hand = [];
	this.sprite_opponent_hand = [];
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
	{
		this.sprite_player_hand.push(init_sprite(this.stage, ANCHOR_EFFECTHAND_PLAYER.x + i*INCREMENT_EFFECTHAND_PLAYER.x, ANCHOR_EFFECTHAND_PLAYER.y - SIZE_CARD.y + i*INCREMENT_EFFECTHAND_PLAYER.y, 0, 0, SIZE_CARD.x, SIZE_CARD.y, 1, true, onClick_card, onHover_card, onMouseout_card));
		this.sprite_player_hand[i].card_index = i;
		this.sprite_opponent_hand.push(init_sprite(this.stage, ANCHOR_EFFECTHAND_OPPONENT.x + i*INCREMENT_EFFECTHAND_OPPONENT.x, ANCHOR_EFFECTHAND_OPPONENT.y + i*INCREMENT_EFFECTHAND_OPPONENT.y, 0, 0, SIZE_CARD.x, SIZE_CARD.y, 1));
	}
	
	//Card Hover Sprite
	this.sprite_card_hover = init_sprite(this.stage, 200, 600, 0.5, 1, 200, 300, 1, false);

	if(State.loaded.all)
		this.init_textures();
}


Game.prototype.processes = {};

Game.prototype.processes[NetProtocol.client.game.STATE] = function(reader)
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
		creature.health_current = reader.read_int8();
		
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
		creature.health_current = reader.read_int8();
		
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
	this.state_set(state);
};

Game.prototype.processes[NetProtocol.client.game.TURN_START_PLAYER] = function()
{
	console.log("It is your turn");
	
	this.state.player.energy_current = this.state.player.energy_max;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.TURN_START_OPPONENT] = function()
{
	console.log("It is your opponent's turn");
	
	this.state.opponent.energy_current = this.state.opponent.energy_max;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.PLAY_CARD_PLAYER] = function(reader)
{
	const index_card = reader.read_int8();
	const id_card = reader.read_string();
	
	const id_card_client = this.state.player.hand.splice(index_card, 1)[0];
	if(id_card_client !== id_card)
		console.error("Card ID mismatch");
	
	console.log("You played " + Data.cards.by_id[id_card].name);
	
	this.state.player.energy_current -= Data.cards.by_id[id_card].cost;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.PLAY_CARD_OPPONENT] = function(reader)
{
	const index_card = reader.read_int8();
	const id_card = reader.read_string();
	
	console.log("Your opponent played " + Data.cards.by_id[id_card].name);
	
	this.state.opponent.handSize--;
	this.state.opponent.energy_current -= Data.cards.by_id[id_card].cost;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DRAW_PLAYER] = function(reader)
{
	const id_card = reader.read_string();
	
	console.log("You drew " + Data.cards.by_id[id_card].name);
	
	this.state.player.deckSize--;
	this.state.player.hand.push(id_card);
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DRAW_OPPONENT] = function()
{
	console.log("Your opponent drew a card");
	
	this.state.opponent.deckSize--;
	this.state.opponent.handSize++;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.MILL_PLAYER] = function(reader)
{
	const id_card = reader.read_string();
	
	console.log("You milled " + Data.cards.by_id[id_card].name);
	
	this.state.player.deckSize--;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.MILL_OPPONENT] = function(reader)
{
	const id_card = reader.read_string();
	
	console.log("Your opponent milled " + Data.cards.by_id[id_card].name);
	
	this.state.opponent.deckSize--;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.GAINMAXENERGY_PLAYER] = function(reader)
{
	const amount = reader.read_int8();
	
	console.log("You gained " + amount + " max energy");
	
	this.state.player.energy_max += amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.GAINMAXENERGY_OPPONENT] = function(reader)
{
	const amount = reader.read_int8();
	
	console.log("Your opponent gained " + amount + " max energy");
	
	this.state.opponent.energy_max += amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DAMAGE_PLAYER] = function(reader)
{
	const index_creature = reader.read_int8();
	const amount = reader.read_int8();
	
	const creature = this.state.player.creatures[index_creature];
	
	console.log("Your " + Data.creatures.by_id[creature.id].name + " took " + amount + " damage");
	
	creature.health_current -= amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DAMAGE_OPPONENT] = function(reader)
{
	const index_creature = reader.read_int8();
	const amount = reader.read_int8();
	
	const creature = this.state.opponent.creatures[index_creature];
	
	console.log("Your opponent's " + Data.creatures.by_id[creature.id].name + " took " + amount + " damage");
	
	creature.health_current -= amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.HEAL_PLAYER] = function(reader)
{
	const index_creature = reader.read_int8();
	const amount = reader.read_int8();
	
	const creature = this.state.player.creatures[index_creature];
	
	console.log("Your " + Data.creatures.by_id[creature.id].name + " restored " + amount + " health");
	
	creature.health_current += amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.HEAL_OPPONENT] = function(reader)
{
	const index_creature = reader.read_int8();
	const amount = reader.read_int8();
	
	const creature = this.state.opponent.creatures[index_creature];
	
	console.log("Your opponent's " + Data.creatures.by_id[creature.id].name + " restored " + amount + " health");
	
	creature.health_current += amount;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DEATH_PLAYER] = function(reader)
{
	const index_creature = reader.read_int8();
	const creature = this.state.player.creatures[index_creature];
	
	console.log("Your " + Data.creatures.by_id[creature.id].name + " died");
	
	creature.health_current = 0;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.DEATH_OPPONENT] = function(reader)
{
	const index_creature = reader.read_int8();
	const creature = this.state.opponent.creatures[index_creature];
	
	console.log("Your opponent's " + Data.creatures.by_id[creature.id].name + " died");
	
	creature.health_current = 0;
	
	this.state_set(this.state);
};

Game.prototype.processes[NetProtocol.client.game.ERROR] = function(reader)
{
	const code = reader.read_int8();
	for(const key in NetProtocol.client.game.error)
		if(NetProtocol.client.game.error[key] === code)
		{
			console.error("Game error: " + key);
			break;
		}
};

Game.prototype.process = function(reader)
{
	const code = reader.read_int8();
	
	const process = this.processes[code];
	if(process !== undefined)
		process.call(this, reader);
	else
		for(const key in NetProtocol.client.game)
			if(NetProtocol.client.game[key] === code)
			{
				console.error("Unhandled game message: " + key);
				break;
			}
};

Game.prototype.init_textures = function()
{
	this.sprite_player_deck.texture = PIXI.loader.resources.deck.texture;
	this.sprite_opponent_deck.texture = PIXI.loader.resources.deck.texture;
	this.sprite_player_energy.texture = PIXI.loader.resources.energy.texture;
	this.sprite_opponent_energy.texture = PIXI.loader.resources.energy.texture;
	this.sprite_ability_box.texture = PIXI.loader.resources.ability_box.texture;
	this.sprite_end_turn_button.texture = PIXI.loader.resources.end_turn.texture;
	this.sprite_card_hover.texture = PIXI.Texture.EMPTY;
	
	if(this.state)
		this.state_set(this.state);
	else
		this.render();
};

// TODO(shawn): should be able to update individual parts of the game state without calling this
Game.prototype.state_set = function(state)
{
	this.state = state;
	
	if(!State.loaded.all)
		return;
	
	for(let i = 0; i < state.player.creatures.length; ++i)
	{
		const creature = state.player.creatures[i];
		creature.health_max = Data.creatures.by_id[creature.id].health;
	}
	
	for(let i = 0; i < state.opponent.creatures.length; ++i)
	{
		const creature = state.opponent.creatures[i];
		creature.health_max = Data.creatures.by_id[creature.id].health;
	}
	
	// player creatures
	this.sprite_player_creature_pos2.texture = PIXI.loader.resources[state.player.creatures[2].id + "_creature"].texture;
	this.sprite_player_creature_pos1.texture = PIXI.loader.resources[state.player.creatures[1].id + "_creature"].texture;
	this.sprite_player_creature_pos0.texture = PIXI.loader.resources[state.player.creatures[0].id + "_creature"].texture;

	// player creature health text
	this.text_player_creature_health_pos0.text = State.game.state.player.creatures[0].health_current + "/" + State.game.state.player.creatures[0].health_max;
	this.text_player_creature_health_pos1.text = State.game.state.player.creatures[1].health_current + "/" + State.game.state.player.creatures[1].health_max;
	this.text_player_creature_health_pos2.text = State.game.state.player.creatures[2].health_current + "/" + State.game.state.player.creatures[2].health_max;
	
	// opponent creatures
	this.sprite_opponent_creature_pos0.texture = PIXI.loader.resources[state.opponent.creatures[0].id + "_creature"].texture;
	this.sprite_opponent_creature_pos1.texture = PIXI.loader.resources[state.opponent.creatures[1].id + "_creature"].texture;
	this.sprite_opponent_creature_pos2.texture = PIXI.loader.resources[state.opponent.creatures[2].id + "_creature"].texture;

	// opponent creature health text
	this.text_opponent_creature_health_pos0.text = State.game.state.opponent.creatures[0].health_current + "/" + State.game.state.opponent.creatures[0].health_max;
	this.text_opponent_creature_health_pos1.text = State.game.state.opponent.creatures[1].health_current + "/" + State.game.state.opponent.creatures[1].health_max;
	this.text_opponent_creature_health_pos2.text = State.game.state.opponent.creatures[2].health_current + "/" + State.game.state.opponent.creatures[2].health_max;
	
	// player hand
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
		this.sprite_player_hand[i].texture = (i < state.player.hand.length) ? PIXI.loader.resources[state.player.hand[i] + "_card"].texture : PIXI.Texture.EMPTY;
	
	// opponent hand
	const texture_cardback = PIXI.loader.resources.cardback.texture;
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
		this.sprite_opponent_hand[i].texture = (i < state.opponent.handSize) ? texture_cardback : PIXI.Texture.EMPTY;
	
	// player info
	this.text_player_energy.text = State.game.state.player.energy_current + "/" + State.game.state.player.energy_max;
	this.text_player_deck.text = State.game.state.player.deckSize.toString();

	// opponent info
	this.text_opponent_energy.text = State.game.state.opponent.energy_current + "/" + State.game.state.opponent.energy_max;
	this.text_opponent_deck.text = State.game.state.opponent.deckSize.toString();

	this.render();
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};