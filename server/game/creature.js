const Data = require("../data.js");


function Creature(game, id_creature, owner)
{
	this.game = game;

	const data_creature = Data.tables.creatures[id_creature];

	this.id = id_creature;
	this.alive = true;
	this.health_current = data_creature.health;
	this.health_max = data_creature.health;
	this.id_ability = data_creature.id_ability;
	this.effects = [];
	this.owner = owner;
}

Creature.prototype.damage = function(source, amount)
{
	if(this.alive)
	{
		if(this.health_current < amount)
			amount = this.health_current;
		this.health_current -= amount;

		this.game.dispatch("damage", {source: source, target: this, amount: amount});

		if(this.health_current === 0)
			this.destroy(source);
	}
};

Creature.prototype.destroy = function(source)
{
	if(this.alive)
	{
		this.health_current = 0;
		this.alive = false;

		this.game.dispatch("death", {source: source, target: this});

		const creatures = this.owner.creatures;
		let index_creature;
		for(index_creature = 0; index_creature < creatures.length; ++index_creature)
			if(creatures[index_creature].alive)
				break;
		
		if(index_creature === creatures.length)
			this.game.dispatch("defeat", {target: this.owner});
	}
};

Creature.prototype.heal = function(source, amount)
{
	if(this.alive)
	{
		if(amount > this.health_max - this.health_current)
			amount = this.health_max - this.health_current;

		this.health_current += amount;

		if(amount > 0)
			this.game.dispatch("heal", {source: source, target: this, amount: amount});
	}
};


module.exports = Creature;
