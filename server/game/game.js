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
				player1: init_player(players[0].name, decks[0]),
				player2: init_player(players[1].name, decks[1]),
				player_current: 0,
				turn: 0,
				effects: []
			};
		});
	});
}

module.exports = Game;