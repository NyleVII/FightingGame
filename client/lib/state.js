/* exported State */

const State = {
	id_player_self: "",
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
			if(State.game !== undefined)
				State.game.init_textures();
		}
	},
	queued: false
};