/* exported State */

const State = {
	id_player_self: "",
	id_player_chat: null,
	loaded:
	{
		assets_cards: false,
		assets_creatures: false,
		assets_misc: false,
		all: false
	},
	loaded_process: function()
	{
		if(State.loaded.assets_cards && State.loaded.assets_creatures && State.loaded.assets_misc)
		{
			State.loaded.all = true;
			if(State.game !== null)
				State.game.init_textures();
		}
	},
	queued: false,
	game: null,
	friends_by_id: {
		id0: {_id: "id0", name: "foo", online: false},
		id1: {_id: "id1", name: "bar", online: false},
		id2: {_id: "id2", name: "lorem", online: true}
	}
};