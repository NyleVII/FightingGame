let game;

//Main render of game screen
document.addEventListener("DOMContentLoaded", function()
{
	document.getElementById("chat_form").onsubmit = function(event)
	{
		event.preventDefault();
		
		const text = document.getElementById("chat_text");
		socket.send("chat " + text.value);
		text.value = "";
	};
	
	renderplayers();
	
	const renderer = PIXI.autoDetectRenderer();
	document.getElementById("gamescreen_inner").appendChild(renderer.view);

	PIXI.loader.add([{name: "mewtwo_player", url:"assets/images/mewtwo/mewtwo_player.gif"},
					{name: "mewtwo_opponent", url:"assets/images/mewtwo/mewtwo_opponent.gif"},
					{name: "mewtwo_card", url:"assets/images/cards/creatures/mewtwo_card.png"},
					{name: "gyarados_player", url:"assets/images/gyarados/gyarados_player.gif"},
					{name: "gyarados_opponent", url:"assets/images/gyarados/gyarados_opponent.gif"},
					{name: "gyarados_card", url:"assets/images/cards/creatures/gyarados_card.png"},
					{name: "cardBack", url:"assets/images/cards/cardBack.png"},
					{name: "effect1", url:"assets/images/cards/effects/17.png"},
					{name: "effect2", url:"assets/images/cards/effects/24.png"},
					{name: "effect3", url:"assets/images/cards/effects/26.png"},
					{name: "effect4", url:"assets/images/cards/effects/27.png"},
					{name: "effect5", url:"assets/images/cards/effects/36.png"},
					{name: "effect6", url:"assets/images/cards/effects/63.png"},
					{name: "effect7", url:"assets/images/cards/effects/74.png"},
					{name: "effect8", url:"assets/images/cards/effects/91.png"},
					{name: "effect9", url:"assets/images/cards/effects/99.png"},
					{name: "effect10", url:"assets/images/cards/effects/109.png"}
				]).load(function()
	{
		game = new Game(renderer);
		game.state_set({
			player:
			{
				creature: {id: "gyarados"},
				effecthand: ["mewtwo", "gyarados","mewtwo","gyarados","mewtwo"],
				creaturehand: []

			},
			opponent:
			{
				creature: {id: "mewtwo"}
			}
		});
		game.render();
	});


});

function renderplayers()
{
	const list = document.getElementById("players_list");
	list.innerHTML = "";
	
	for (const i in players)
	{
		const player = document.createElement("div");
		player.className = "player";
		player.innerHTML = players[i].alias;
		
		list.appendChild(player);
	}
}