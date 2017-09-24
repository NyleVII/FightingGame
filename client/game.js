function Game(renderer)
{
	this.state = {};
	
	this.renderer = renderer;
	this.stage = new PIXI.Container();
	
	this.sprite_player_creature = new PIXI.Sprite();
	this.sprite_player_creature.anchor.set(0, 1);
	this.sprite_player_creature.y = renderer.height;
	this.stage.addChild(this.sprite_player_creature);
	
	this.sprite_opponent_creature = new PIXI.Sprite();
	this.sprite_opponent_creature.anchor(1, 0);
	this.sprite_opponent_creature.x = renderer.width;
	this.stage.addChild(this.sprite_opponent_creature);
}


Game.prototype.state_set = function(state)
{
	this.state = state;
	
	this.sprite_player_creature.texture = PIXI.loader.resources[state.player.creature.id].texture;
	this.sprite_opponent_creature.texture = PIXI.loader.resources[state.opponent.creature.id].texture;
};

Game.prototype.render = function()
{
	this.renderer.render(this.stage);
};