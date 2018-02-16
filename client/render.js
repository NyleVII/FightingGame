//Main render of game screen
document.addEventListener("DOMContentLoaded", function()
{
	document.getElementById("chat_form").onsubmit = function(event)
	{
		event.preventDefault();
		
		const text = document.getElementById("chat_text");
		
		const buffer_text = [0x00];
		for(let i = 0; i < text.value.length; ++i)
			buffer_text.push(text.value.charCodeAt(i) & 0xff);
		socket.send(new Uint8Array(buffer_text));
		text.value = "";
	};
	
	const dom_tooltip = document.getElementById("tooltip");
	document.onmousemove = function(event)
	{
		dom_tooltip.style.left = event.clientX + 16 + "px";
		dom_tooltip.style.top = event.clientY + 16 + "px";
	};
	
	renderplayers();
	
	const renderer = PIXI.autoDetectRenderer();
	document.getElementById("gamescreen_inner").appendChild(renderer.view);
	
	
	PIXI.loader.add([
		{name: "mewtwo_player", url:"assets/images/mewtwo/mewtwo_player.gif"},
		{name: "mewtwo_opponent", url:"assets/images/mewtwo/mewtwo_opponent.gif"},
		{name: "mewtwo_card", url:"assets/images/cards/creatures/mewtwo_card.png"},
		{name: "gyarados_player", url:"assets/images/gyarados/gyarados_player.gif"},
		{name: "gyarados_opponent", url:"assets/images/gyarados/gyarados_opponent.gif"},
		{name: "gyarados_card", url:"assets/images/cards/creatures/gyarados_card.png"},
		{name: "energy", url:"assets/images/energy.jpg"},
		{name: "deck", url:"assets/images/cards/deck.png"},
		{name: "cardBack", url:"assets/images/cards/cardBack.png"},
		{name: "effect1_card", url:"assets/images/cards/effects/17.png"},
		{name: "effect2_card", url:"assets/images/cards/effects/24.png"},
		{name: "effect3_card", url:"assets/images/cards/effects/26.png"},
		{name: "effect4_card", url:"assets/images/cards/effects/27.png"},
		{name: "effect5_card", url:"assets/images/cards/effects/36.png"},
		{name: "effect6_card", url:"assets/images/cards/effects/63.png"},
		{name: "effect7_card", url:"assets/images/cards/effects/74.png"},
		{name: "effect8_card", url:"assets/images/cards/effects/91.png"},
		{name: "effect9_card", url:"assets/images/cards/effects/99.png"},
		{name: "effect10_card", url:"assets/images/cards/effects/109.png"},
	]).load(function()
	{
		game = new Game(renderer);
		game.state_set({
			player:
			{
				creature: {id: "gyarados"},
				effecthand: ["rampage", "frostbolt", "sogg_yaron", "stonetusk_boar", "fireball"],

			},
			opponent:
			{
				creature: {id: "mewtwo"},
				effecthandsize: 5,
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
		player.innerHTML = players[i].name;
		if(i != id_player_self)
		{
			const challengePlayer = document.createElement("div");
			challengePlayer.className = "challengePlayer";
			challengePlayer.innerHTML = "Fight!";
			player.appendChild(challengePlayer);
		}
		
		list.appendChild(player);
	}
}