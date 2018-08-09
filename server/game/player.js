const Random = require("../random.js");
const Creature = require("./creature.js");


const NUM_STARTINGENERGY = 3;
const NUM_STARTINGCARDS = 3;


function Player(game, loadout)
{
	const player = this;
	
	player.game = game;
	
	const cards = loadout.cards.slice();
	Random.shuffle(cards);
	
	player.energy_max = NUM_STARTINGENERGY;
	player.energy_current = 0;
	player.creatures = loadout.creatures.map(function(id_creature)
	{
		return new Creature(game, id_creature, player);
	});
	player.hand = cards.splice(0, NUM_STARTINGCARDS);
	player.deck = cards;
}


Player.prototype.draw = function()
{
	if(this.deck.length === 0)
		return;
	
	const id_card = this.deck.splice(0, 1)[0];
	
	if(this.hand.length >= 10)
		this.game.dispatch("mill", {source: this, target: id_card});
	else
	{
		this.hand.push(id_card);
		this.game.dispatch("draw", {source: this, target: id_card});
	}
};

Player.prototype.gainenergy = function(amount)
{
	this.energy_current += amount;
	
	this.game.dispatch("gainenergy", {target: this, amount: amount});
};

Player.prototype.gainmaxenergy = function(amount)
{
	this.energy_max += amount;
	
	this.game.dispatch("gainmaxenergy", {target: this, amount: amount});
};


module.exports = Player;