const Data = require("../data.js");
const BufferWriter = require("../bufferwriter.js");


function shuffle(list)
{
	for(let i = list.length; i; --i)
	{
		const j = Math.floor(Math.random()*i);
		const temp = list[i - 1];
		list[i - 1] = list[j];
		list[j] = temp;
	}
}

function drawcards(player, num_cards)
{
	player.hand.push(...player.deck.splice(0, num_cards));
}

function init_player(loadout)
{
	const cards = loadout.cards.slice();
	shuffle(cards);
	
	const player = {
		energy_max: 2,
		energy_current: 0,
		creatures: loadout.creatures,
		hand: [],
		deck: cards
	};
	
	drawcards(player, 5);
	
	return player;
}

function Game(player1, player2)
{
	const game = this;
	
	game.players = [player1, player2];
	shuffle(game.players);
	
	Promise.all([
		global.collections.loadouts.findOne({_id: game.players[0].id_activeloadout}),
		global.collections.loadouts.findOne({_id: game.players[1].id_activeloadout})
	]).then(function(loadouts)
	{
		game.state =
		{
			players:
			[
				init_player(loadouts[0]),
				init_player(loadouts[1])
			],
			phase: "game",
			index_currentplayer: 0,
			turn: 0
		};
	});
}


Game.prototype.encodestate = function(index_player)
{
	const buffer = [];
	
	const player = this.state.players[index_player];
	const opponent = this.state.players[index_player ^ 1];
	
	// player
	buffer.push(player.energy_max);
	buffer.push(player.energy_current);
	buffer.push(player.deck.length);
	
	for(let i = 0; i < player.creatures.length; ++i)
	{
		const creature = player.creatures[i];
		
		BufferWriter.string(creature._id);
		buffer.push(creature.hp);
		
		buffer.push(creature.abilities.length);
		for(let j = 0; j < creature.abilities.length; ++j)
			BufferWriter.string(buffer, creature.abilities[j]);
		
		buffer.push(creature.effects.length);
		for(let j = 0; j < creature.effects.length; ++j)
			BufferWriter.string(buffer, creature.effects[j]);
	}
	
	buffer.push(player.hand.length);
	for(let i = 0; i < player.hand.length; ++i)
		BufferWriter.string(buffer, player.hand[i]);
	
	// opponent
	buffer.push(opponent.energy_current);
	buffer.push(opponent.deck.length);
	
	for(let i = 0; i < opponent.creatures.length; ++i)
	{
		const creature = opponent.creatures[i];
		
		BufferWriter.string(creature._id);
		buffer.push(creature.hp);
		
		buffer.push(creature.abilities.length);
		for(let j = 0; j < creature.abilities.length; ++j)
			BufferWriter.string(buffer, creature.abilities[j]);
		
		buffer.push(creature.effects.length);
		for(let j = 0; j < creature.effects.length; ++j)
			BufferWriter.string(buffer, creature.effects[j]);
	}
	
	buffer.push(opponent.hand.length);
	
	buffer.push(index_player ^ this.state.index_currentplayer);
	buffer.push(this.state.turn);
	
	return buffer;
};

Game.prototype.endturn = function()
{
	// TODO(shawn): trigger end of turn event
	this.state.index_currentplayer ^= 1;
	this.state.turn++;
	
	const player_current = this.state.players[this.state.index_currentplayer];
	player_current.energy_current = player_current.energy_max;
	drawcards(player_current, 1);
};

Game.prototype.processes =
{
	main:
	{
		card: function(player, action)
		{
			const card = Data.cards[player.hand[action.index]];
			
			// TODO(shawn): send "invalid" message to client
			if(card.cost > player.energy_current)
				return;
			
			// deduct card cost from player energy
			player.energy_current -= card.cost;
			
			// remove card from hand
			player.hand.splice(action.index, 1);
			
			// TODO(shawn): resolve card effect
		}
	}
};

Game.prototype.process = function(index_player, action)
{
	const process = this.processes[this.phase][action.type];
	if(process !== undefined)
		process.call(this, this.players[index_player], action);
};

module.exports = Game;