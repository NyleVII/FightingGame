const MAX_EFFECTHANDSIZE = 5;
const MAX_CREATUREHANDSIZE = 5;
const OFFSET_EFFECTHAND_PLAYER = {x: 400, y: 200};
const OFFSET_CREATUREHAND_PLAYER = {x: 100, y: 100};
const OFFSET_EFFECTHAND_OPPONENT = {x: 325, y: 100};
const OFFSET_CREATUREHAND_OPPONENT = {x: 25, y: 0};
const INCREMENT_EFFECTHAND_PLAYER = {x: 50, y: 0};
const INCREMENT_CREATUREHAND_PLAYER = {x: -50, y: 0};
const INCREMENT_EFFECTHAND_OPPONENT = {x: -50, y: 0};
const INCREMENT_CREATUREHAND_OPPONENT = {x: 50, y: 0};
const CREATURE_SPACING = 110;
const SIZE_CARD = {x: 75, y: 100};


function Game(renderer)
{
	this.state = {};
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();

	//TEMPORARY
	//Graphics to draw grid lines to double check spacing
	this.graphics = new PIXI.Graphics();
	this.graphics.lineStyle(1, 0xffffff, 1);
	this.graphics.moveTo(0,300);
	this.graphics.lineTo(800,300);
	this.graphics.moveTo(400,0);
	this.graphics.lineTo(400,600);
	this.stage.addChild(this.graphics);

	this.graphics.drawRect(50, 380, 300, 200);
	this.stage.addChild(this.graphics);
	
	

	//Add player pos 3 creature sprite to game screen
	this.sprite_player_creature_pos3 = new PIXI.Sprite();
	this.sprite_player_creature_pos3.anchor.set(0, 0.5);
	this.sprite_player_creature_pos3.width = 100;
	this.sprite_player_creature_pos3.height = 100;
	this.sprite_player_creature_pos3.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos3);

	//Add player pos 2 creature sprite to game screen
	this.sprite_player_creature_pos2 = new PIXI.Sprite();
	this.sprite_player_creature_pos2.anchor.set(0, 0.5);
	this.sprite_player_creature_pos2.width = 100;
	this.sprite_player_creature_pos2.height = 100;
	this.sprite_player_creature_pos2.x = CREATURE_SPACING;
	this.sprite_player_creature_pos2.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos2);

	//Add player pos 1 creature sprite to game screen
	this.sprite_player_creature_pos1 = new PIXI.Sprite();
	this.sprite_player_creature_pos1.anchor.set(0, 0.5);
	this.sprite_player_creature_pos1.width = 100;
	this.sprite_player_creature_pos1.height = 100;
	this.sprite_player_creature_pos1.x = CREATURE_SPACING *2;
	this.sprite_player_creature_pos1.y = renderer.height/2;
	this.stage.addChild(this.sprite_player_creature_pos1);

	//Add opponent pos 1 creature sprite to game screen
	this.sprite_opponent_creature_pos1 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos1.anchor.set(1, 0.5);
	this.sprite_opponent_creature_pos1.width = 100;
	this.sprite_opponent_creature_pos1.height = 100;
	this.sprite_opponent_creature_pos1.x = renderer.width - CREATURE_SPACING*2;
	this.sprite_opponent_creature_pos1.y = renderer.height/2;
	this.stage.addChild(this.sprite_opponent_creature_pos1);

	//Add opponent pos 2 creature sprite to game screen
	this.sprite_opponent_creature_pos2 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos2.anchor.set(1, 0.5);
	this.sprite_opponent_creature_pos2.width = 100;
	this.sprite_opponent_creature_pos2.height = 100;
	this.sprite_opponent_creature_pos2.x = renderer.width - CREATURE_SPACING;
	this.sprite_opponent_creature_pos2.y = renderer.height/2;
	this.stage.addChild(this.sprite_opponent_creature_pos2);

	//Add opponent pos 3 creature sprite to game screen
	this.sprite_opponent_creature_pos3 = new PIXI.Sprite();
	this.sprite_opponent_creature_pos3.anchor.set(1, 0.5);
	this.sprite_opponent_creature_pos3.width = 100;
	this.sprite_opponent_creature_pos3.height = 100;
	this.sprite_opponent_creature_pos3.x = renderer.width;
	this.sprite_opponent_creature_pos3.y = renderer.height/2;
	this.stage.addChild(this.sprite_opponent_creature_pos3);
	

	//Add player energy sprite to game screen
	this.sprite_player_energy = new PIXI.Sprite();
	this.sprite_player_energy.anchor.set(1,1);
	this.sprite_player_energy.width = 100;
	this.sprite_player_energy.height = 100;
	this.sprite_player_energy.x = renderer.width;
	this.sprite_player_energy.y = renderer.height;
	this.sprite_player_energy.texture = PIXI.loader.resources["energy"].texture;
	this.stage.addChild(this.sprite_player_energy);

	//Add opponent energy sprite to game screen
	this.sprite_opponent_energy = new PIXI.Sprite();
	this.sprite_opponent_energy.anchor.set(0,0);
	this.sprite_opponent_energy.width = 100;
	this.sprite_opponent_energy.height = 100;
	//this.sprite_opponent_energy.x = renderer.width - this.sprite_opponent_creature.width;
	this.sprite_opponent_energy.texture = PIXI.loader.resources["energy"].texture;
	this.stage.addChild(this.sprite_opponent_energy);
	
	this.sprite_player_effecthand = [];
	this.sprite_opponent_effecthand = [];
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
	{
		let sprite = new PIXI.Sprite();
		sprite.x = renderer.width - OFFSET_EFFECTHAND_PLAYER.x + i*INCREMENT_EFFECTHAND_PLAYER.x;
		sprite.y = renderer.height - OFFSET_EFFECTHAND_PLAYER.y + i*INCREMENT_EFFECTHAND_PLAYER.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_player_effecthand.push(sprite);
		this.stage.addChild(sprite);
		
		sprite = new PIXI.Sprite();
		sprite.x = OFFSET_EFFECTHAND_OPPONENT.x + i*INCREMENT_EFFECTHAND_OPPONENT.x;
		sprite.y = OFFSET_EFFECTHAND_OPPONENT.y + i*INCREMENT_EFFECTHAND_OPPONENT.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_opponent_effecthand.push(sprite);
		this.stage.addChild(sprite);
	}
	/*
	this.sprite_player_creaturehand = [];
	this.sprite_opponent_creaturehand = [];
	for (let i = 0; i < MAX_CREATUREHANDSIZE; ++i)
	{
		let sprite = new PIXI.Sprite();
		sprite.x = renderer.width - OFFSET_CREATUREHAND_PLAYER.x + i*INCREMENT_CREATUREHAND_PLAYER.x;
		sprite.y = renderer.height - OFFSET_CREATUREHAND_PLAYER.y + i*INCREMENT_CREATUREHAND_PLAYER.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_player_creaturehand.push(sprite);
		this.stage.addChild(sprite);
		
		sprite = new PIXI.Sprite();
		sprite.x = OFFSET_CREATUREHAND_OPPONENT.x + i*INCREMENT_CREATUREHAND_OPPONENT.x;
		sprite.y = OFFSET_CREATUREHAND_OPPONENT.y + i*INCREMENT_CREATUREHAND_OPPONENT.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_opponent_creaturehand.push(sprite);
		this.stage.addChild(sprite);
	}
	*/
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	//this.sprite_player_creature.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos3.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos2.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_player_creature_pos1.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_opponent_creature_pos1.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
	this.sprite_opponent_creature_pos2.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
	this.sprite_opponent_creature_pos3.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
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