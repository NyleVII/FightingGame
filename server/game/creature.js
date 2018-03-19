const Data = require("../data.js");


function Creature(game, id_creature)
{
	this.game = game;
	
	const data_creature = Data.creatures[id_creature];
	
	this.id = id_creature;
	this.health = data_creature.health;
	this.id_ability = data_creature.id_ability;
	this.effects = [];
}

Creature.prototype.damage = function(source, amount)
{
	if(this.health < amount)
		amount = this.health;
	this.health -= amount;
	
	this.game.dispatch("damage", {source: source, target: this, amount: amount});
	
	if(this.health === 0)
		this.destroy(source);
};

Creature.prototype.destroy = function(source)
{
	this.health = 0;
	
	this.game.dispatch("death", {source: source, target: this});
};

Creature.prototype.heal = function(source, amount)
{
	if(this.health > 0)
	{
		this.health += amount;
		
		this.game.dispatch("heal", {source: source, target: this, amount: amount});
	}
};


module.exports = Creature;