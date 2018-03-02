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

function drawcard(deck)
{
	return deck.splice(0, 1)[0];
}

function init_player(name, loadout)
{
	const cards = loadout.cards.slice();
	shuffle(cards);
	
	return {
		name: name,
		energy_max: 2,
		energy_current: 0,
		creatures: loadout.creatures,
		hand: [drawcard(cards), drawcard(cards), drawcard(cards), drawcard(cards), drawcard(cards)],
		deck: cards
	};
}

function Game(player1, player2)
{
	const game = this;
	
	const players = [player1, player2];
	shuffle(players);
	
	Promise.all([
		global.collections.loadouts.findOne({_id: players[0].id_activeloadout}),
		global.collections.loadouts.findOne({_id: players[1].id_activeloadout})
	]).then(function(loadouts)
	{
		game.state =
		{
			players:
			[
				init_player(players[0].name, loadouts[0]),
				init_player(players[1].name, loadouts[1])
			],
			phase: "game",
			player_current: 0,
			turn: 0
		};
	});
}


Game.prototype.processes =
{
	main:
	{
		card: function(player, action)
		{
			const id_card = player.hand[action.index];
			
			// TODO(shawn): get card data from data store
			
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