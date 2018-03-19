const MAX_EFFECTHANDSIZE = 5;
const ANCHOR_EFFECTHAND_PLAYER = {x: 400, y: 600};
const ANCHOR_EFFECTHAND_OPPONENT = {x: 25, y: 0};
const INCREMENT_EFFECTHAND_PLAYER = {x: 50, y: 0};
const INCREMENT_EFFECTHAND_OPPONENT = {x: 50, y: 0}; //OPPONENT HAND GROWS TO THE LEFT
const CREATURE_SPACING = 110;
const SIZE_CARD = {x: 75, y: 100};

		//init_sprite(<stage>, num, num, num, num, num, num, num, boolean, function)
function init_sprite(stage, x, y, x_anchor, y_anchor, width, height, scale_x, interactive, onClick, onHover)
{
	console.log("Initiating sprite...");
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
		console.log("Interactive is true");
		sprite.on("click", onClick);
		sprite.on("mouseover", onHover);
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
	function onClick_creature()
	{
		console.log("Clicked a creature");
		game.text_command_card.text = "Clicked a creature";
		game.render();
	}

	function onHover_creature(event)
	{
		console.log("Hovering over creature");
		console.log(event.target);
		let target;
		if(event.target.is_mine)
		{
			target = State.game.state.player.creatures[event.target.creature_index];
		}
		else
		{
			target = State.game.state.opponent.creatures[event.target.creature_index];
		}
		//game.text_command_card.text = "Hovering over creature " + target.id;
		game.text_command_card.text = "Hovering over " + Data.creatures.by_id[target.id].name;
		game.render();
	}

	function onClick_card()
	{
		console.log("Clicked a card");
		game.text_command_card.text = "Clicked a card";
		game.render();
	}

	function onHover_card(event)
	{
		console.log("Hovering over:");
		console.log(event.currentTarget);

		game.text_command_card.text = "Hovering over card";
		game.render();
	}


	this.state = {};
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();

	//TEMPORARY
	//Graphics to draw grid lines to double check spacing
	this.graphics = new PIXI.Graphics();
	this.graphics.lineStyle(1, 0xffffff, 1);
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
	
	// add player creature sprites to game screen
	this.sprite_player_creature_pos0 = init_sprite(this.stage, CREATURE_SPACING*2, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos0.creature_index = 0;
	this.sprite_player_creature_pos0.is_mine = true;
	this.sprite_player_creature_pos1 = init_sprite(this.stage, CREATURE_SPACING, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos1.creature_index = 1;
	this.sprite_player_creature_pos1.is_mine = true;
	this.sprite_player_creature_pos2 = init_sprite(this.stage, 0, renderer.height/2, 0, 1, 100, 100, 1, true, onClick_creature, onHover_creature);
	this.sprite_player_creature_pos2.creature_index = 2;
	this.sprite_player_creature_pos2.is_mine = true;
	
	// add opponent creature sprites to game screen
	this.sprite_opponent_creature_pos0 = init_sprite(this.stage, renderer.width - CREATURE_SPACING*2, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos0.creature_index = 0;
	this.sprite_opponent_creature_pos0.is_mine = false;
	this.sprite_opponent_creature_pos1 = init_sprite(this.stage, renderer.width - CREATURE_SPACING, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos1.creature_index = 1;
	this.sprite_opponent_creature_pos1.is_mine = false;
	this.sprite_opponent_creature_pos2 = init_sprite(this.stage, renderer.width, renderer.height/2, 0, 1, 100, 100, -1, true, onClick_creature, onHover_creature);
	this.sprite_opponent_creature_pos2.creature_index = 2;
	this.sprite_opponent_creature_pos2.is_mine = false;

	// player deck and energy info sprites
	this.sprite_player_deck = init_sprite(this.stage, 200, renderer.height, 0, 1, 50, 50, 1, false);
	this.sprite_player_deck.texture = PIXI.loader.resources.deck.texture;
	this.sprite_player_energy = init_sprite(this.stage, 280, renderer.height, 0, 1, 50, 50, 1, false);
	this.sprite_player_energy.texture = PIXI.loader.resources.energy.texture;
	
	// player deck and energy info text
	this.text_player_deck = init_text(this.stage, this.sprite_player_deck.x + this.sprite_player_deck.width, this.sprite_player_deck.y - this.sprite_player_deck.height/2, 0, 0.5);
	this.text_player_energy = init_text(this.stage, this.sprite_player_energy.x + this.sprite_player_energy.width, this.sprite_player_energy.y - this.sprite_player_energy.height/2, 0, 0.5);
	this.text_player_name = init_text(this.stage, 20, renderer.height - this.sprite_player_energy.height/2, 0, 0.5);
	this.text_player_name.text = Data.players[State.id_player_self].name;
	
	// opponent deck and energy info sprites
	this.sprite_opponent_deck = init_sprite(this.stage, 520, 0, 0, 0, 50, 50, 1, false);
	this.sprite_opponent_deck.texture = PIXI.loader.resources.deck.texture;
	this.sprite_opponent_energy = init_sprite(this.stage, renderer.width/2, 0, 0, 0, 50, 50, 1, false);
	this.sprite_opponent_energy.texture = PIXI.loader.resources.energy.texture;
	
	// opponent deck and energy info text
	this.text_opponent_deck = init_text(this.stage, this.sprite_opponent_deck.x + this.sprite_opponent_deck.width, this.sprite_opponent_deck.y + this.sprite_opponent_deck.height/2, 0, 0.5);
	this.text_opponent_energy = init_text(this.stage, this.sprite_opponent_energy.x + this.sprite_opponent_energy.width, this.sprite_opponent_energy.y + this.sprite_opponent_energy.height/2, 0, 0.5);
	this.text_opponent_name = init_text(this.stage, renderer.width - 20, 25, 1, 0.5);
	this.text_opponent_name.text = opponent.name;

	// hand card sprites
	this.sprite_player_hand = [];
	this.sprite_opponent_hand = [];
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
	{
		this.sprite_player_hand.push(init_sprite(this.stage, ANCHOR_EFFECTHAND_PLAYER.x + i*INCREMENT_EFFECTHAND_PLAYER.x, ANCHOR_EFFECTHAND_PLAYER.y - SIZE_CARD.y + i*INCREMENT_EFFECTHAND_PLAYER.y, 0, 0, SIZE_CARD.x, SIZE_CARD.y, 1, true, onClick_card, onHover_card));
		this.sprite_opponent_hand.push(init_sprite(this.stage, ANCHOR_EFFECTHAND_OPPONENT.x + i*INCREMENT_EFFECTHAND_OPPONENT.x, ANCHOR_EFFECTHAND_OPPONENT.y + i*INCREMENT_EFFECTHAND_OPPONENT.y, 0, 0, SIZE_CARD.x, SIZE_CARD.y, 1, true, onClick_card, onHover_card));
	}
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	// player creatures
	this.sprite_player_creature_pos2.texture = PIXI.loader.resources[state.player.creatures[2].id + "_creature"].texture;
	this.sprite_player_creature_pos1.texture = PIXI.loader.resources[state.player.creatures[1].id + "_creature"].texture;
	this.sprite_player_creature_pos0.texture = PIXI.loader.resources[state.player.creatures[0].id + "_creature"].texture;
	
	// opponent creatures
	this.sprite_opponent_creature_pos0.texture = PIXI.loader.resources[state.opponent.creatures[0].id + "_creature"].texture;
	this.sprite_opponent_creature_pos1.texture = PIXI.loader.resources[state.opponent.creatures[1].id + "_creature"].texture;
	this.sprite_opponent_creature_pos2.texture = PIXI.loader.resources[state.opponent.creatures[2].id + "_creature"].texture;
	
	// player hand
	for (let i = 0; i < state.player.hand.length; ++i)
		this.sprite_player_hand[i].texture = PIXI.loader.resources[state.player.hand[i] + "_card"].texture;
	
	// opponent hand
	const texture_cardback = PIXI.loader.resources.cardback.texture;
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
		this.sprite_opponent_hand[i].texture = (i < state.opponent.handSize) ? texture_cardback : undefined;
	
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