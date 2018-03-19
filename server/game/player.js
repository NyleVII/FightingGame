const Random = require("../random.js");
const Creature = require("./creature.js");


const NUM_STARTINGENERGY = 2;
const NUM_STARTINGCARDS = 4;


function Player(game, loadout)
{
	this.game = game;
	
	const cards = loadout.cards.slice();
	Random.shuffle(cards);
	
	this.energy_max = NUM_STARTINGENERGY;
	this.energy_current = 0;
	this.creatures = loadout.creatures.map(function(id_creature)
	{
		return new Creature(game, id_creature);
	});
	this.hand = cards.splice(0, NUM_STARTINGCARDS);
	this.deck = cards;
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

Player.prototype.gainmaxenergy = function()
{
	this.energy_max++;
	
	this.game.dispatch("gainmaxenergy", {source: this});
};


module.exports = Player;