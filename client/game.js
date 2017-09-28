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
const SIZE_CARD = {x: 75, y: 100};


function Game(renderer)
{
	this.state = {};
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();
	
	//Add player creature sprite to game screen
	this.sprite_player_creature = new PIXI.Sprite();
	this.sprite_player_creature.anchor.set(0, 1);
	this.sprite_player_creature.width = 300;
	this.sprite_player_creature.height = 300;
	this.sprite_player_creature.y = renderer.height;
	this.stage.addChild(this.sprite_player_creature);
	
	//Add opponent creature sprite to game screen
	this.sprite_opponent_creature = new PIXI.Sprite();
	this.sprite_opponent_creature.anchor.set(1, 0);
	this.sprite_opponent_creature.width = 300;
	this.sprite_opponent_creature.height = 300;
	this.sprite_opponent_creature.x = renderer.width;
	this.stage.addChild(this.sprite_opponent_creature);

	//Add player energy sprite to game screen
	this.sprite_player_energy = new PIXI.Sprite();
	this.sprite_player_energy.anchor.set(0,1);
	this.sprite_player_energy.width = 100;
	this.sprite_player_energy.height = 100;
	this.sprite_player_energy.x = this.sprite_player_creature.x + this.sprite_player_creature.width;
	this.sprite_player_energy.y = renderer.height;
	this.sprite_player_energy.texture = PIXI.loader.resources["energy"].texture;
	this.stage.addChild(this.sprite_player_energy);

	//Add opponent energy sprite to game screen
	this.sprite_opponent_energy = new PIXI.Sprite();
	this.sprite_opponent_energy.anchor.set(1,0);
	this.sprite_opponent_energy.width = 100;
	this.sprite_opponent_energy.height = 100;
	this.sprite_opponent_energy.x = renderer.width - this.sprite_opponent_creature.width;
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
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	this.sprite_player_creature.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_opponent_creature.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
	
	for (let i = 0; i < state.player.effecthand.length; ++i)
		this.sprite_player_effecthand[i].texture = PIXI.loader.resources[state.player.effecthand[i] + "_card"].texture;
	
	for (let i = 0; i < state.player.creaturehand.length; ++i)
	{
		// console.log(state.player.creaturehand[i] + "_card");
		this.sprite_player_creaturehand[i].texture = PIXI.loader.resources[state.player.creaturehand[i] + "_card"].texture;
	}
	
	const texture_cardback = PIXI.loader.resources.cardBack.texture;
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
		this.sprite_opponent_effecthand[i].texture = (i < state.opponent.effecthandsize) ? texture_cardback : undefined;
	for (let i = 0; i < MAX_CREATUREHANDSIZE; ++i)
		this.sprite_opponent_creaturehand[i].texture = (i < state.opponent.creaturehandsize) ? texture_cardback : undefined;
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};