const Data = require("../data.js");
const BufferWriter = require("../bufferwriter.js");
const Random = require("../random.js");
const Player = require("./player.js");
const Network = require("../network.js");
const NetProtocol = require("../../netprotocol.json");
const CardGrammar = require("../cardgrammar.js");


function send(player, buffer)
{
	if(player !== null)
		Network.send(player.connection, buffer);
}


function Game(player1, player2)
{
	const game = this;

	game.listeners = {
		startturn: [],
		endturn: [],
		defeat: [],
		draw: [],
		mill: [],
		gainmaxenergy: [],
		gainenergy: [],
		damage: [],
		death: [],
		heal: []
	};

	game.players = [player1, player2];
	Random.shuffle(game.players);
	game.id_players = game.players.map(player => player._id);

	Promise.all([
		Data.collections.loadouts.findOne({_id: game.players[0].id_loadout_active}),
		Data.collections.loadouts.findOne({_id: game.players[1].id_loadout_active})
	]).then(function(loadouts)
	{
		game.state =
		{
			players:
			[
				new Player(game, loadouts[0]),
				new Player(game, loadouts[1])
			],
			phase: "game",
			index_currentplayer: 0,
			turn: 0
		};

		game.state.players[0].energy_current = game.state.players[0].energy_max;

		let buffer;

		buffer = [NetProtocol.client.GAMESTART];
		BufferWriter.string(buffer, game.players[1]._id);
		send(game.players[0], buffer);

		buffer = [NetProtocol.client.GAMESTART];
		BufferWriter.string(buffer, game.players[0]._id);
		send(game.players[1], buffer);

		const prefix = [NetProtocol.client.GAME, NetProtocol.client.game.STATE];
		send(game.players[0], prefix.concat(game.encodestate(0)));
		send(game.players[1], prefix.concat(game.encodestate(1)));

		game.dispatch("startturn", {target: game.state.players[0]});
	});
}


Game.prototype.communicate = {
	startturn: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);

		send(this.players[index_player], [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_PLAYER]);
		send(this.players[index_player ^ 1], [NetProtocol.client.GAME, NetProtocol.client.game.TURN_START_OPPONENT]);
	},

	defeat: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);

		send(this.players[index_player], [NetProtocol.client.GAME, NetProtocol.client.game.DEFEAT]);
		send(this.players[index_player ^ 1], [NetProtocol.client.GAME, NetProtocol.client.game.WIN]);
	},

	draw: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.DRAW_PLAYER];
		BufferWriter.string(buffer_player, params.target);

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], [NetProtocol.client.GAME, NetProtocol.client.game.DRAW_OPPONENT]);
	},

	mill: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.MILL_PLAYER];
		BufferWriter.string(buffer_player, params.target);

		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.MILL_OPPONENT];
		BufferWriter.string(buffer_opponent, params.target);

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	},

	gainmaxenergy: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.GAINMAXENERGY_PLAYER, params.amount];
		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.GAINMAXENERGY_OPPONENT, params.amount];

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	},

	gainenergy: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.GAINENERGY_PLAYER, params.amount];
		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.GAINENERGY_OPPONENT, params.amount];

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	},

	damage: function(params)
	{
		const index_player = this.state.players.indexOf(params.target.owner);
		const index_creature = params.target.owner.creatures.indexOf(params.target);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.DAMAGE_PLAYER, index_creature, params.amount];
		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.DAMAGE_OPPONENT, index_creature, params.amount];

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	},

	death: function(params)
	{
		const index_player = this.state.players.indexOf(params.target.owner);
		const index_creature = params.target.owner.creatures.indexOf(params.target);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.DEATH_PLAYER, index_creature];
		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.DEATH_OPPONENT, index_creature];

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	},

	heal: function(params)
	{
		const index_player = this.state.players.indexOf(params.target.owner);
		const index_creature = params.target.owner.creatures.indexOf(params.target);

		const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.HEAL_PLAYER, index_creature, params.amount];
		const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.HEAL_OPPONENT, index_creature, params.amount];

		send(this.players[index_player], buffer_player);
		send(this.players[index_player ^ 1], buffer_opponent);
	}
};


Game.prototype.processes = {};

Game.prototype.processes[NetProtocol.server.game.ENDTURN] = function(index_player)
{
	const player = this.players[index_player];

	if(index_player !== this.state.index_currentplayer)
		send(player, [NetProtocol.client.GAME, NetProtocol.client.game.ERROR, NetProtocol.client.game.error.NOT_YOUR_TURN]);
	else
		this.endturn();
};

Game.prototype.processes[NetProtocol.server.game.PLAY_CARD] = function(index_player, buffer_process)
{
	const player = this.players[index_player];

	if(index_player !== this.state.index_currentplayer)
		send(player, [NetProtocol.client.GAME, NetProtocol.client.game.ERROR, NetProtocol.client.game.error.NOT_YOUR_TURN]);
	else
	{
		const index_card = buffer_process.readUInt8(2);
		const playerstate = this.state.players[index_player];

		if(index_card < 0 || index_card >= playerstate.hand.length)
			send(player, [NetProtocol.client.GAME, NetProtocol.client.game.ERROR, NetProtocol.client.game.error.CARD_INDEX_OUT_OF_BOUNDS]);
		else
		{
			const card = Data.tables.cards[playerstate.hand[index_card]];

			if(playerstate.energy_current < card.cost)
				send(player, [NetProtocol.client.GAME, NetProtocol.client.game.ERROR, NetProtocol.client.game.error.NOT_ENOUGH_ENERGY]);
			else
			{
				const id_card = playerstate.hand.splice(index_card, 1)[0];

				playerstate.energy_current -= card.cost;

				const buffer_player = [NetProtocol.client.GAME, NetProtocol.client.game.PLAY_CARD_PLAYER, index_card];
				BufferWriter.string(buffer_player, id_card);
				send(player, buffer_player);

				const buffer_opponent = [NetProtocol.client.GAME, NetProtocol.client.game.PLAY_CARD_OPPONENT, index_card];
				BufferWriter.string(buffer_opponent, id_card);
				send(this.players[index_player ^ 1], buffer_opponent);

				const buffer = card.effect;
				let index_buffer = 0;

				const num_effects = buffer[index_buffer++];
				for(let index_effect = 0; index_effect < num_effects; ++index_effect)
				{
					const type = buffer[index_buffer++];
					index_buffer = this.process_effects[type].call(this, index_player, playerstate, buffer, index_buffer);
				}
			}
		}
	}
};

Game.prototype.process = function(index_player, buffer_process)
{
	const process = this.processes[buffer_process.readUInt8(1)];
	if(process !== undefined)
		process.call(this, index_player, buffer_process);
};

Game.prototype.process_effects = [
	function(index_player, source, buffer, index) // DRAW
	{
		const flags_allegiance = buffer[index++];
		const amount = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
			for(let index_draw = 0; index_draw < amount; ++index_draw)
				this.state.players[index_player].draw();
		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
			for(let index_draw = 0; index_draw < amount; ++index_draw)
				this.state.players[index_player ^ 1].draw();

		return index;
	},

	function(index_player, source, buffer, index) // DAMAGE
	{
		const flags_allegiance = buffer[index++];
		const flags_position = buffer[index++];
		const amount = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
		{
			const playerstate = this.state.players[index_player];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].damage(source, amount);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].damage(source, amount);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].damage(source, amount);
		}

		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
		{
			const playerstate = this.state.players[index_player ^ 1];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].damage(source, amount);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].damage(source, amount);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].damage(source, amount);
		}

		return index;
	},

	function(index_player, source, buffer, index) // HEAL
	{
		const flags_allegiance = buffer[index++];
		const flags_position = buffer[index++];
		const amount = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
		{
			const playerstate = this.state.players[index_player];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].heal(source, amount);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].heal(source, amount);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].heal(source, amount);
		}

		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
		{
			const playerstate = this.state.players[index_player ^ 1];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].heal(source, amount);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].heal(source, amount);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].heal(source, amount);
		}

		return index;
	},

	function(index_player, source, buffer, index) // SHUFFLE
	{
		const flags_allegiance = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
			Random.shuffle(this.state.players[index_player].creatures);
		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
			Random.shuffle(this.state.players[index_player ^ 1].creatures);

		return index;
	},

	function(index_player, source, buffer, index) // GAIN MAX ENERGY
	{
		const flags_allegiance = buffer[index++];
		const amount = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
			this.state.players[index_player].gainmaxenergy(amount);

		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
			this.state.players[index_player ^ 1].gainmaxenergy(amount);

		return index;
	},

	function(index_player, source, buffer, index) // GAIN ENERGY
	{
		const amount = buffer[index++];

		this.state.players[index_player].energy_current += amount;

		return index;
	},

	function(index_player, source, buffer, index) // DESTROY
	{
		const flags_allegiance = buffer[index++];
		const flags_position = buffer[index++];

		if(flags_allegiance & CardGrammar.ALLEGIANCE_FRIENDLY)
		{
			const playerstate = this.state.players[index_player];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].destroy(source);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].destroy(source);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].destroy(source);
		}

		if(flags_allegiance & CardGrammar.ALLEGIANCE_ENEMY)
		{
			const playerstate = this.state.players[index_player ^ 1];

			if(flags_position & CardGrammar.POSITION_FRONT)
				playerstate.creatures[0].destroy(source);
			if(flags_position & CardGrammar.POSITION_MIDDLE)
				playerstate.creatures[1].destroy(source);
			if(flags_position & CardGrammar.POSITION_BACK)
				playerstate.creatures[2].destroy(source);
		}

		return index;
	}
];

Game.prototype.endturn = function()
{
	const playerstate_current = this.state.players[this.state.index_currentplayer];

	this.dispatch("endturn", {target: playerstate_current});

	this.state.index_currentplayer ^= 1;
	this.state.turn++;

	const playerstate_next = this.state.players[this.state.index_currentplayer];

	this.dispatch("startturn", {target: playerstate_next});

	playerstate_next.energy_current = playerstate_next.energy_max;
	playerstate_next.draw();
};

Game.prototype.listen = function(event, listener)
{
	this.listeners[event].push(listener);
};

Game.prototype.dispatch = function(event, params)
{
	const communicate = this.communicate[event];
	if(communicate !== undefined)
		communicate.call(this, params);

	const listeners = this.listeners[event];
	for(let index_listener = 0; index_listener < listeners.length; ++index_listener)
		listeners[index_listener].notify(params);
};


Game.prototype.encodestate = function(index_player)
{
	const buffer = [];

	const playerstate = this.state.players[index_player];
	const opponentstate = this.state.players[index_player ^ 1];

	// player
	buffer.push(playerstate.energy_max);
	buffer.push(playerstate.energy_current);
	buffer.push(playerstate.deck.length);

	for(let index_creature = 0; index_creature < playerstate.creatures.length; ++index_creature)
	{
		const creature = playerstate.creatures[index_creature];

		BufferWriter.string(buffer, creature.id);
		buffer.push(creature.health_current);

		BufferWriter.string(buffer, creature.id_ability);

		buffer.push(creature.effects.length);
		for(let index_effect = 0; index_effect < creature.effects.length; ++index_effect)
			BufferWriter.string(buffer, creature.effects[index_effect]);
	}

	buffer.push(playerstate.hand.length);
	for(let index_card = 0; index_card < playerstate.hand.length; ++index_card)
		BufferWriter.string(buffer, playerstate.hand[index_card]);

	// opponent
	buffer.push(opponentstate.energy_max);
	buffer.push(opponentstate.energy_current);
	buffer.push(opponentstate.deck.length);

	for(let index_creature = 0; index_creature < opponentstate.creatures.length; ++index_creature)
	{
		const creature = opponentstate.creatures[index_creature];

		BufferWriter.string(buffer, creature.id);
		buffer.push(creature.health_current);

		BufferWriter.string(buffer, creature.id_ability);

		buffer.push(creature.effects.length);
		for(let index_effect = 0; index_effect < creature.effects.length; ++index_effect)
			BufferWriter.string(buffer, creature.effects[index_effect]);
	}

	buffer.push(opponentstate.hand.length);

	buffer.push(index_player ^ this.state.index_currentplayer);
	buffer.push(this.state.turn);

	return buffer;
};


module.exports = Game;
