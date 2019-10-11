const Mongo = require("mongodb");
const Config = require("../appconfig.json");
const Log = require("./log.js");
const NetProtocol = require("../netprotocol.json");
const BufferWriter = require("./bufferwriter.js");
const CardGrammar = require("./cardgrammar.js");

function CardReader(buffer)
{
	this.buffer = buffer;
	this.index = 0;
	this.text = "";
}

CardReader.prototype.text_position = function(allegiance, position)
{
	let text = "";
	if(allegiance === CardGrammar.ALLEGIANCE_FRIENDLY)
		text += "your ";
	else if(allegiance === CardGrammar.ALLEGIANCE_ENEMY)
		text += "your opponent's ";
	else if(position === (CardGrammar.POSITION_FRONT|CardGrammar.POSITION_MIDDLE|CardGrammar.POSITION_BACK))
		text += "all ";
	else
		text += "each player's ";

	if(position === CardGrammar.POSITION_FRONT)
		text += "front creature";
	else if(position === CardGrammar.POSITION_MIDDLE)
		text += "middle creature";
	else if(position === CardGrammar.POSITION_BACK)
		text += "back creature";
	else if(position === (CardGrammar.POSITION_FRONT|CardGrammar.POSITION_MIDDLE))
		text += "front two creatures";
	else if(position === (CardGrammar.POSITION_FRONT|CardGrammar.POSITION_BACK))
		text += "front and back creatures";
	else if(position === (CardGrammar.POSITION_MIDDLE|CardGrammar.POSITION_BACK))
		text += "back two creatures";
	else
		text += "creatures";

	return text;
};

CardReader.prototype.text_effect = [
	function() // DRAW
	{
		const allegiance = this.buffer[this.index++];
		const amount = this.buffer[this.index++];

		let text = "";
		if(allegiance === CardGrammar.ALLEGIANCE_FRIENDLY)
			text += "Draw ";
		else if(allegiance === CardGrammar.ALLEGIANCE_ENEMY)
			text += "Your opponent draws ";
		else
			text += "Each player draws ";

		if(amount === 1)
			text += "a card.";
		else
			text += amount + " cards.";

		return text;
	},

	function() // DAMAGE
	{
		const allegiance = this.buffer[this.index++];
		const position = this.buffer[this.index++];
		const amount = this.buffer[this.index++];

		return "Deal " + amount + " damage to " + this.text_position(allegiance, position) + ".";
	},

	function() // HEAL
	{
		const allegiance = this.buffer[this.index++];
		const position = this.buffer[this.index++];
		const amount = this.buffer[this.index++];

		return "Restore " + amount + " health to " + this.text_position(allegiance, position) + ".";
	},

	function() // SHUFFLE
	{
	},

	function() // GAIN MAX ENERGY
	{
		const allegiance = this.buffer[this.index++];
		const amount = this.buffer[this.index++];

		let text = "";
		if(allegiance === CardGrammar.ALLEGIANCE_FRIENDLY)
			text += "Gain ";
		else if(allegiance === CardGrammar.ALLEGIANCE_ENEMY)
			text += "Your opponent gains ";
		else
			text += "Each player gains ";

		return text + amount + " maximum energy.";
	},

	function() // GAIN ENERGY
	{
		const amount = this.buffer[this.index++];

		return "Gain " + amount + " energy.";
	},

	function() // DESTROY
	{
		const allegiance = this.buffer[this.index++];
		const position = this.buffer[this.index++];

		return "Destroy " + this.text_position(allegiance, position) + ".";
	}
];

CardReader.prototype.read = function()
{
	const num_effects = this.buffer[this.index++];

	for(let index_effect = 0; index_effect < num_effects; ++index_effect)
	{
		if(index_effect > 0)
			this.text += " ";
		this.text += this.text_effect[this.buffer[this.index++]].call(this);
	}
};

const Data = {
	tables: {
		abilities: null,
		cards: null,
		creatures: null
	},
	buffers: {
		abilities: null,
		cards: null,
		creatures: null
	},
	collections: {
		loadouts: null,
		players: null
	},
	db: null,

	initialize: function()
	{
		Data.db = null;

		Mongo.MongoClient.connect("mongodb://" + Config.mongo_host + ":" + Config.mongo_port + "/" + Config.mongo_db, {useNewUrlParser: true}, function(error, client)
		{
			if (error !== null)
				Log.error(error, "connecting to database");
			else
			{
				Data.db = client.db("game");

				Data.collections.loadouts = Data.db.collection("loadouts");
				Data.collections.players = Data.db.collection("players");

				Data.load_tables();
			}
		});
	},

	load_tables: function()
	{
		if(Data.db === null)
			return;

		function load_table(name_table, callback)
		{
			Data.db.collection(name_table).find().toArray(function(error, documents)
			{
				const table = Data.tables[name_table] = {};

				if(error !== null)
					Log.error(error, "loading " + name_table + " table");
				else
					for(let index_document = 0; index_document < documents.length; ++index_document)
						table[documents[index_document]._id] = documents[index_document];

				callback();
			});
		}

		load_table("abilities", function()
		{
			Data.buffers.abilities = [NetProtocol.client.DATADUMP_ABILITY];
			for(const id_ability in Data.tables.abilities)
			{
				const ability = Data.tables.abilities[id_ability];

				BufferWriter.string(Data.buffers.abilities, ability._id);
				BufferWriter.string(Data.buffers.abilities, ability.name);
				Data.buffers.abilities.push(ability.cost);
			}
		});

		load_table("cards", function()
		{
			Data.buffers.cards = [NetProtocol.client.DATADUMP_CARD];
			for(const id_card in Data.tables.cards)
			{
				const card = Data.tables.cards[id_card];

				BufferWriter.string(Data.buffers.cards, card._id);
				BufferWriter.string(Data.buffers.cards, card.name);
				Data.buffers.cards.push(card.cost);

				// generate card text
				const reader = new CardReader(card.effect);
				reader.read();
				card.text = reader.text;

				BufferWriter.string(Data.buffers.cards, card.text);
			}
		});

		load_table("creatures", function()
		{
			Data.buffers.creatures = [NetProtocol.client.DATADUMP_CREATURE];
			for(const id_creature in Data.tables.creatures)
			{
				const creature = Data.tables.creatures[id_creature];

				BufferWriter.string(Data.buffers.creatures, creature._id);
				BufferWriter.string(Data.buffers.creatures, creature.name);
				Data.buffers.creatures.push(creature.health);
			}
		});
	}
};

module.exports = Data;