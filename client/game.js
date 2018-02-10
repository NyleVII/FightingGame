const MAX_EFFECTHANDSIZE = 5;
const ANCHOR_EFFECTHAND_PLAYER = {x: 400, y: 600};
const ANCHOR_EFFECTHAND_OPPONENT = {x: 25, y: 0};
const INCREMENT_EFFECTHAND_PLAYER = {x: 50, y: 0};
const INCREMENT_EFFECTHAND_OPPONENT = {x: 50, y: 0}; //OPPONENT HAND GROWS TO THE LEFT
const CREATURE_SPACING = 110;
const SIZE_CARD = {x: 75, y: 100};

const textStyle = new PIXI.TextStyle({
	fill: "white"
});

function Game(renderer)
{
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
	this.stage.addChild(this.graphics);
	
	

	//Add player pos 3 creature sprite to game screen
	this.sprite_player_creature_pos3 = new PIXI.Sprite();
	this.sprite_player_creature_pos3.anchor.set(0, 1);
	this.sprite_player_creature_pos3.width = 100;
	this.sprite_player_creature_pos3.height = 100;
	this.sprite_player_creature_pos3.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos3);

	//Add player pos 2 creature sprite to game screen
	this.sprite_player_creature_pos2 = new PIXI.Sprite();
	this.sprite_player_creature_pos2.anchor.set(0, 1);
	this.sprite_player_creature_pos2.width = 100;
	this.sprite_player_creature_pos2.height = 100;
	this.sprite_player_creature_pos2.x = CREATURE_SPACING;
	this.sprite_player_creature_pos2.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos2);

	//Add player pos 1 creature sprite to game screen
	this.sprite_player_creature_pos1 = new PIXI.Sprite();
	this.sprite_player_creature_pos1.anchor.set(0, 1);
	this.sprite_player_creature_pos1.width = 100;
	this.sprite_player_creature_pos1.height = 100;
	this.sprite_player_creature_pos1.x = CREATURE_SPACING *2;
	this.sprite_player_creature_pos1.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos1);

	//Add opponent pos 1 creature sprite to game screen
	this.sprite_opponent_creature_pos1 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos1.anchor.set(0, 1);
	this.sprite_opponent_creature_pos1.width = 100;
	this.sprite_opponent_creature_pos1.height = 100;
	this.sprite_opponent_creature_pos1.x = renderer.width - CREATURE_SPACING*2;
	this.sprite_opponent_creature_pos1.y = renderer.height/2;
	this.sprite_opponent_creature_pos1.scale.x = -1; //This flips the sprite on the vertical axis
	this.stage.addChild(this.sprite_opponent_creature_pos1);

	//Add opponent pos 2 creature sprite to game screen
	this.sprite_opponent_creature_pos2 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos2.anchor.set(0, 1);
	this.sprite_opponent_creature_pos2.width = 100;
	this.sprite_opponent_creature_pos2.height = 100;
	this.sprite_opponent_creature_pos2.x = renderer.width - CREATURE_SPACING;
	this.sprite_opponent_creature_pos2.y = renderer.height/2;
	this.sprite_opponent_creature_pos2.scale.x = -1; //This flips the sprite on the vertical axis
	this.stage.addChild(this.sprite_opponent_creature_pos2);

	//Add opponent pos 3 creature sprite to game screen
	this.sprite_opponent_creature_pos3 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos3.anchor.set(0, 1);
	this.sprite_opponent_creature_pos3.width = 100;
	this.sprite_opponent_creature_pos3.height = 100;
	this.sprite_opponent_creature_pos3.x = renderer.width;
	this.sprite_opponent_creature_pos3.y = renderer.height/2;
	this.sprite_opponent_creature_pos3.scale.x = -1; //This flips the sprite on the vertical axis
	this.stage.addChild(this.sprite_opponent_creature_pos3);
	
	//PLAYER INFO
	//Add player deck sprite to game screen
	this.sprite_player_deck = new PIXI.Sprite();
	this.sprite_player_deck.anchor.set(0, 1);
	this.sprite_player_deck.width = 50;
	this.sprite_player_deck.height = 50;
	this.sprite_player_deck.x = 200;
	this.sprite_player_deck.y = renderer.height;
	this.sprite_player_deck.texture = PIXI.loader.resources["deck"].texture;
	this.stage.addChild(this.sprite_player_deck);

	//Add player deck text to game screen
	const playerDeck = new PIXI.Text("55", textStyle);
	playerDeck.anchor.set(0, 0.5);
	playerDeck.x = this.sprite_player_deck.x + this.sprite_player_deck.width;
	playerDeck.y = this.sprite_player_deck.y - this.sprite_player_deck.height/2;
	this.stage.addChild(playerDeck);


	//Add player energy sprite to game screen
	this.sprite_player_energy = new PIXI.Sprite();
	this.sprite_player_energy.anchor.set(0, 1);
	this.sprite_player_energy.width = 50;
	this.sprite_player_energy.height = 50;
	this.sprite_player_energy.x = 280;
	this.sprite_player_energy.y = renderer.height;
	this.sprite_player_energy.texture = PIXI.loader.resources["energy"].texture;
	this.stage.addChild(this.sprite_player_energy);

	//Add player energy text to game screen
	const playerEnergy = new PIXI.Text("10/10", textStyle);
	playerEnergy.anchor.set(0, 0.5);
	playerEnergy.x = this.sprite_player_energy.x + this.sprite_player_energy.width;
	playerEnergy.y = this.sprite_player_energy.y - this.sprite_player_energy.height/2;
	this.stage.addChild(playerEnergy);

	//Add player name to game screen
	const playerName = new PIXI.Text("Player", textStyle);
	playerName.anchor.set(0, 0.5);
	playerName.x = 20;
	playerName.y = renderer.height - this.sprite_player_energy.height/2;
	this.stage.addChild(playerName);

	//OPPONENT INFO
	//Add opponent energy sprite to game screen
	this.sprite_opponent_energy = new PIXI.Sprite();
	this.sprite_opponent_energy.anchor.set(0, 0);
	this.sprite_opponent_energy.width = 50;
	this.sprite_opponent_energy.height = 50;
	this.sprite_opponent_energy.x = renderer.width/2;
	this.sprite_opponent_energy.texture = PIXI.loader.resources["energy"].texture;
	this.stage.addChild(this.sprite_opponent_energy);

	//Add opponent energy text to game screen
	const opponentEnergy = new PIXI.Text("20/20", textStyle);
	opponentEnergy.anchor.set(0, 0.5);
	opponentEnergy.x = this.sprite_opponent_energy.x + this.sprite_opponent_energy.width;
	opponentEnergy.y = this.sprite_opponent_energy.y + this.sprite_opponent_energy.height/2;
	this.stage.addChild(opponentEnergy);

	//Add opponent deck sprite to game screen
	this.sprite_opponent_deck = new PIXI.Sprite();
	this.sprite_opponent_deck.anchor.set(0, 0);
	this.sprite_opponent_deck.width = 50;
	this.sprite_opponent_deck.height = 50;
	this.sprite_opponent_deck.x = 520;
	this.sprite_opponent_deck.y = 0;
	this.sprite_opponent_deck.texture = PIXI.loader.resources["deck"].texture;
	this.stage.addChild(this.sprite_opponent_deck);

	//Add opponent deck text to game screen
	const opponentDeck = new PIXI.Text("99", textStyle);
	opponentDeck.anchor.set(0, 0.5);
	opponentDeck.x = this.sprite_opponent_deck.x + this.sprite_opponent_deck.width;
	opponentDeck.y = this.sprite_opponent_deck.y + this.sprite_opponent_deck.height/2;
	this.stage.addChild(opponentDeck);

	//Add opponent name to game screen
	const opponentName = new PIXI.Text("Opponent", textStyle);
	opponentName.anchor.set(1, 0.5);
	opponentName.x = renderer.width - 20;
	opponentName.y = 25;
	this.stage.addChild(opponentName);


	

	//Add effect hands to screen
	this.sprite_player_effecthand = [];
	this.sprite_opponent_effecthand = [];
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
	{
		let sprite = new PIXI.Sprite();
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		sprite.x = ANCHOR_EFFECTHAND_PLAYER.x + i*INCREMENT_EFFECTHAND_PLAYER.x;
		sprite.y = ANCHOR_EFFECTHAND_PLAYER.y - sprite.height + i*INCREMENT_EFFECTHAND_PLAYER.y;
		
		
		this.sprite_player_effecthand.push(sprite);
		this.stage.addChild(sprite);
		
		sprite = new PIXI.Sprite();
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		sprite.x = ANCHOR_EFFECTHAND_OPPONENT.x + i*INCREMENT_EFFECTHAND_OPPONENT.x;
		sprite.y = ANCHOR_EFFECTHAND_OPPONENT.y + i*INCREMENT_EFFECTHAND_OPPONENT.y;
		
		
		this.sprite_opponent_effecthand.push(sprite);
		this.stage.addChild(sprite);
	}
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	//this.sprite_player_creature.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos3.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos2.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos1.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_opponent_creature_pos1.texture = PIXI.loader.resources[state.opponent.creature.id + "_player"].texture;
	this.sprite_opponent_creature_pos2.texture = PIXI.loader.resources[state.opponent.creature.id + "_player"].texture;
	this.sprite_opponent_creature_pos3.texture = PIXI.loader.resources[state.opponent.creature.id + "_player"].texture;
	//this.sprite_opponent_creature.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
	
	for (let i = 0; i < state.player.effecthand.length; ++i)
		this.sprite_player_effecthand[i].texture = PIXI.loader.resources[state.player.effecthand[i] + "_card"].texture;
	
	/*
	for (let i = 0; i < state.player.creaturehand.length; ++i)
		this.sprite_player_creaturehand[i].texture = PIXI.loader.resources[state.player.creaturehand[i] + "_card"].texture;
	*/
	
	const texture_cardback = PIXI.loader.resources.cardBack.texture;
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
		this.sprite_opponent_effecthand[i].texture = (i < state.opponent.effecthandsize) ? texture_cardback : undefined;
	/*
	for (let i = 0; i < MAX_CREATUREHANDSIZE; ++i)
		this.sprite_opponent_creaturehand[i].texture = (i < state.opponent.creaturehandsize) ? texture_cardback : undefined;
	*/
		
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};