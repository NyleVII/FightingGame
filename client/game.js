const MAX_HANDSIZE = 5;
const X_OFFSET_EFFECTHAND = 400;
const X_INCREMENT_EFFECTHAND = 50;
const Y_OFFSET_EFEFCTHAND = 200;
const Y_INCREMENT_EFFECTHAND = 0;


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
	
	this.sprite_effectcards = [];
	for (let i = 0; i < MAX_HANDSIZE; ++i)
	{
		const sprite = new PIXI.Sprite();
		sprite.x = renderer.width - X_OFFSET_EFFECTHAND + i*X_INCREMENT_EFFECTHAND;
		sprite.y = renderer.height - Y_OFFSET_EFEFCTHAND + i*Y_INCREMENT_EFFECTHAND;
		
		this.sprite_effectcards.push(sprite);
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
		this.sprite_effectcards[i].texture = PIXI.loader.resources[state.player.effecthand[i] + "_card"].texture;
	}
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};