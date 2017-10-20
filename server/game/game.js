function shuffle(list)
{
	for (let i = list.length; i; --i)
	{
		const j = Math.floor(Math.random()*i);
		const temp = list[i - 1];
		list[i - 1] = list[j];
		list[j] = temp;
	}
}

function init_player(name, deck)
{
	shuffle(deck);
	
	return {
		name: name,
		mulligan: false,
		energy_max: 2,
		energy_current: 0,
		creatures: [],
		hand: [],
		deck: deck.cards,
		effects: []
	};
}

function Game(id_deck1, id_deck2)
{
	const game = this;
	
	Promise.all([
		global.collections.decks.findOne({_id: id_deck1}),
		global.collections.decks.findOne({_id: id_deck2})
	]).then(function(decks)
	{
		shuffle(decks);
		
		return Promise.all([
			global.collections.players.findOne({_id: decks[0].id_player}),
			global.collections.players.findOne({_id: decks[1].id_player})
		]).then(function(players)
		{
			game.state =
			{
				players:
				[
					init_player(players[0].name, decks[0]),
					init_player(players[1].name, decks[1])
				],
				phase: "mulligan",
				player_current: 0,
				turn: 0,
				effects: []
			};
		});
	});
}


Game.prototype.processes =
{
	mulligan:
	{
		mulligan: function(player, action)
		{
			if (!player.mulligan)
			{
				const hand = [];
				for (let i = 0; i < action.cards.length; ++i)
					hand.push(player.hand[action.cards[i]]);
				player.hand = hand;
				player.mulligan = true;
			}
			
			// start game
			if (this.players[0].mulligan && this.players[1].mulligan)
				this.phase = "main";
		}
	},
	
	main:
	{
		card: function(player, action)
		{
			const id_card = player.hand[action.index];
			
			// TODO(shawn): get card data from data store
			
			// TODO(shawn): send "invalid" message to client
			if (card.cost > player.energy_current)
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
	if (process !== undefined)
		process.call(this, this.players[index_player], action);
};

module.exports = Game;