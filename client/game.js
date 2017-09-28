const MAX_EFFECTHANDSIZE = 5;
const MAX_CREATUREHANDSIZE = 5;
const OFFSET_EFFECTHAND = {x: 400, y: 200};
const OFFSET_CREATUREHAND = {x: 100, y: 100};
const INCREMENT_EFFECTHAND = {x: 50, y: 0};
const INCREMENT_CREATUREHAND = {x: -50, y: 0};
const SIZE_CARD = {x: 75, y: 100};


function Game(renderer)
{
	this.state = {};
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();
	
	this.sprite_player_creature = new PIXI.Sprite();
	this.sprite_player_creature.anchor.set(0, 1);
	this.sprite_player_creature.width = 300;
	this.sprite_player_creature.height = 300;
	this.sprite_player_creature.y = renderer.height;
	this.stage.addChild(this.sprite_player_creature);
	
	this.sprite_opponent_creature = new PIXI.Sprite();
	this.sprite_opponent_creature.anchor.set(1, 0);
	this.sprite_opponent_creature.width = 300;
	this.sprite_opponent_creature.height = 300;
	this.sprite_opponent_creature.x = renderer.width;
	this.stage.addChild(this.sprite_opponent_creature);
	
	this.sprite_effecthand = [];
	for (let i = 0; i < MAX_EFFECTHANDSIZE; ++i)
	{
		const sprite = new PIXI.Sprite();
		sprite.x = renderer.width - OFFSET_EFFECTHAND.x + i*INCREMENT_EFFECTHAND.x;
		sprite.y = renderer.height - OFFSET_EFFECTHAND.y + i*INCREMENT_EFFECTHAND.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_effecthand.push(sprite);
		this.stage.addChild(sprite);
	}
	
	this.sprite_creaturehand = [];
	for (let i = 0; i < MAX_CREATUREHANDSIZE; ++i)
	{
		const sprite = new PIXI.Sprite();
		sprite.x = renderer.width - OFFSET_CREATUREHAND.x + i*INCREMENT_CREATUREHAND.x;
		sprite.y = renderer.height - OFFSET_CREATUREHAND.y + i*INCREMENT_CREATUREHAND.y;
		sprite.width = SIZE_CARD.x;
		sprite.height = SIZE_CARD.y;
		
		this.sprite_creaturehand.push(sprite);
		this.stage.addChild(sprite);
	}
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	this.sprite_player_creature.texture = PIXI.loader.resources[state.player.creature.id + "_player"].texture;
	this.sprite_opponent_creature.texture = PIXI.loader.resources[state.opponent.creature.id + "_opponent"].texture;
	
	for (let i = 0; i < state.player.effecthand.length; ++i){
		console.log(state.player.effecthand[i] + "_card");
		this.sprite_effecthand[i].texture = PIXI.loader.resources[state.player.effecthand[i] + "_card"].texture;
	}

	for (let i = 0; i < state.player.creaturehand.length; ++i){
		console.log(state.player.creaturehand[i] + "_card");
		this.sprite_creaturehand[i].texture = PIXI.loader.resources[state.player.creaturehand[i] + "_card"].texture;
	}
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};