const Data = require("../data.js");
const BufferWriter = require("../bufferwriter.js");
const Random = require("../random.js");
const Player = require("./player.js");
const Network = require("../network.js");
const Protocol = require("../../netprotocol.json");


function Game(connection1, connection2)
{
	const game = this;
	
	game.listeners = {
		startturn: [],
		endturn: [],
		draw: [],
		mill: [],
		gainmaxenergy: [],
		gainenergy: [],
		damage: [],
		death: [],
		heal: []
	};
	
	game.connections = [connection1, connection2];
	Random.shuffle(game.connections);
	
	game.loaded = Promise.all([
		global.collections.loadouts.findOne({_id: game.connections[0].player.id_activeloadout}),
		global.collections.loadouts.findOne({_id: game.connections[1].player.id_activeloadout})
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
	});
}


const ALLEGIANCE_FRIENDLY = 0x01;
const ALLEGIANCE_ENEMY = 0x02;

const POSITION_FRONT = 0x01;
const POSITION_MIDDLE = 0x02;
const POSITION_BACK = 0x04;

Game.prototype.communicate = {
	startturn: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);
		
		Network.send(this.connections[index_player], [Protocol.server.game.TURN_START]);
	},
	
	endturn: function(params)
	{
		const index_player = this.state.players.indexOf(params.target);
		
		Network.send(this.connections[index_player], [Protocol.server.game.TURN_END]);
	},
	
	draw: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);
		
		const buffer_player = [Protocol.server.game.DRAW_PLAYER];
		BufferWriter.string(buffer_player, params.target);
		
		Network.send(this.connections[index_player], buffer_player);
		Network.send(this.connections[index_player ^ 1], [Protocol.server.game.DRAW_OPPONENT]);
	},
	
	mill: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);
		
		const buffer_player = [Protocol.server.game.MILL_PLAYER];
		BufferWriter.string(buffer_player, params.target);
		
		const buffer_opponent = [Protocol.server.game.MILL_OPPONENT];
		BufferWriter.string(buffer_opponent, params.target);
		
		Network.send(this.connections[index_player], buffer_player);
		Network.send(this.connections[index_player ^ 1], buffer_opponent);
	},
	
	gainmaxenergy: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);
		
		const buffer_player = [Protocol.server.game.GAINMAXENERGY_PLAYER, params.amount];
		const buffer_opponent = [Protocol.server.game.GAINMAXENERGY_OPPONENT, params.amount];
		
		Network.send(this.connections[index_player], buffer_player);
		Network.send(this.connections[index_player ^ 1], buffer_opponent);
	},
	
	gainenergy: function(params)
	{
		const index_player = this.state.players.indexOf(params.source);
		
		const buffer_player = [Protocol.server.game.GAINENERGY_PLAYER, params.amount];
		const buffer_opponent = [Protocol.server.game.GAINENERGY_OPPONENT, params.amount];
		
		Network.send(this.connections[index_player], buffer_player);
		Network.send(this.connections[index_player ^ 1], buffer_opponent);
	},
	
	damage: function()
	{
	},
	
	death: function()
	{
		
	},
	
	heal: function()
	{
		
	}
};

Game.prototype.process_effects = [
	function(index_player, source, buffer, index) // DRAW
	{
		const flags_allegiance = buffer[index++];
		const amount = buffer[index++];
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
			for(let i = 0; i < amount; ++i)
				this.state.players[index_player].draw();
		if(flags_allegiance & ALLEGIANCE_ENEMY)
			for(let i = 0; i < amount; ++i)
				this.state.players[index_player ^ 1].draw();
		
		return index;
	},
	
	function(index_player, source, buffer, index) // DAMAGE
	{
		const flags_allegiance = buffer[index++];
		const flags_position = buffer[index++];
		const amount = buffer[index++];
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
		{
			const player = this.state.players[index_player];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].damage(source, amount);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[1].damage(source, amount);
			if(flags_position & POSITION_BACK)
				player.creatures[2].damage(source, amount);
		}
		
		if(flags_allegiance & ALLEGIANCE_ENEMY)
		{
			const player = this.state.players[index_player ^ 1];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].damage(source, amount);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[0].damage(source, amount);
			if(flags_position & POSITION_BACK)
				player.creatures[0].damage(source, amount);
		}
		
		return index;
	},
	
	function(index_player, source, buffer, index) // HEAL
	{
		const flags_allegiance = buffer[index++];
		const flags_position = buffer[index++];
		const amount = buffer[index++];
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
		{
			const player = this.state.players[index_player];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].heal(source, amount);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[1].heal(source, amount);
			if(flags_position & POSITION_BACK)
				player.creatures[2].heal(source, amount);
		}
		
		if(flags_allegiance & ALLEGIANCE_ENEMY)
		{
			const player = this.state.players[index_player ^ 1];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].heal(source, amount);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[1].heal(source, amount);
			if(flags_position & POSITION_BACK)
				player.creatures[2].heal(source, amount);
		}
		
		return index;
	},
	
	function(index_player, source, buffer, index) // SHUFFLE
	{
		const flags_allegiance = buffer[index++];
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
			Random.shuffle(this.state.players[index_player].creatures);
		if(flags_allegiance & ALLEGIANCE_ENEMY)
			Random.shuffle(this.state.players[index_player ^ 1].creatures);
		
		return index;
	},
	
	function(index_player, source, buffer, index) // GAIN MAX ENERGY
	{
		const flags_allegiance = buffer[index++];
		const amount = buffer[index++];
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
		{
			const player = this.state.players[index_player];
			
			player.energy_max += amount;
			this.dispatch("gainmaxenergy", {target: player});
		}
		
		if(flags_allegiance & ALLEGIANCE_ENEMY)
		{
			const player = this.state.players[index_player ^ 1];
			
			player.energy_max += amount;
			this.dispatch("gainmaxenergy", {target: player});
		}
		
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
		
		if(flags_allegiance & ALLEGIANCE_FRIENDLY)
		{
			const player = this.state.players[index_player];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].destroy(source);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[1].destroy(source);
			if(flags_position & POSITION_BACK)
				player.creatures[2].destroy(source);
		}
		
		if(flags_allegiance & ALLEGIANCE_ENEMY)
		{
			const player = this.state.players[index_player ^ 1];
			
			if(flags_position & POSITION_FRONT)
				player.creatures[0].destroy(source);
			if(flags_position & POSITION_MIDDLE)
				player.creatures[1].destroy(source);
			if(flags_position & POSITION_BACK)
				player.creatures[2].destroy(source);
		}
		
		return index;
	}
];

Game.prototype.playcard = function(index_player, index_card)
{
	const player = this.state.players[index_player];
	const card = Data.cards[player.hand[index_card]];
	
	if(player.energy < card.cost)
		return -1;
	
	const buffer = card.effect;
	let index = 0;
	
	const num_effects = buffer[index++];
	for(let i = 0; i < num_effects; ++i)
	{
		const type = buffer[index++];
		index = this.process_effects[type].call(this, index_player, player, buffer, index);
	}
};

Game.prototype.endturn = function()
{
	const player_current = this.state.players[this.state.index_currentplayer];
	
	this.dispatch("endturn", {target: player_current});
	
	this.state.index_currentplayer ^= 1;
	this.state.turn++;
	
	const player_next = this.state.players[this.state.index_currentplayer];
	
	this.dispatch("startturn", {target: player_next});
	
	player_next.energy_current = player_current.energy_max;
	player_next.draw();
};

Game.prototype.listen = function(event, listener)
{
	this.listeners[event].push(listener);
};

Game.prototype.dispatch = function(event, params)
{
	const e = this.listeners[event];
	for(let i = 0; i < e.length; ++i)
		e[i].notify(params);
};


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
		
		BufferWriter.string(buffer, creature.id);
		buffer.push(creature.health);
		
		BufferWriter.string(buffer, creature.id_ability);
		
		buffer.push(creature.effects.length);
		for(let j = 0; j < creature.effects.length; ++j)
			BufferWriter.string(buffer, creature.effects[j]);
	}
	
	buffer.push(player.hand.length);
	for(let i = 0; i < player.hand.length; ++i)
		BufferWriter.string(buffer, player.hand[i]);
	
	// opponent
	buffer.push(opponent.energy_max);
	buffer.push(opponent.energy_current);
	buffer.push(opponent.deck.length);
	
	for(let i = 0; i < opponent.creatures.length; ++i)
	{
		const creature = opponent.creatures[i];
		
		BufferWriter.string(buffer, creature.id);
		buffer.push(creature.health);
		
		BufferWriter.string(buffer, creature.id_ability);
		
		buffer.push(creature.effects.length);
		for(let j = 0; j < creature.effects.length; ++j)
			BufferWriter.string(buffer, creature.effects[j]);
	}
	
	buffer.push(opponent.hand.length);
	
	buffer.push(index_player ^ this.state.index_currentplayer);
	buffer.push(this.state.turn);
	
	return buffer;
};


module.exports = Game;