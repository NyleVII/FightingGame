//Game sprites
const playerCreatureSprite = new PIXI.Sprite;
const opponentCreatureSprite = new PIXI.Sprite;
const energySprite = new PIXI.Sprite;
const cardBackSprite = new PIXI.Sprite;
const cardOneSprite = new PIXI.Sprite;
const cardTwoSprite = new PIXI.Sprite;
const cardThreeSprite = new PIXI.Sprite;
const cardFourSprite = new PIXI.Sprite;
const cardFiveSprite = new PIXI.Sprite;

//PIXI stage and renderer
let renderer;
let stage;

let gameState = {
	me: {
		creature: {
			id: "gyarados"
		}

	},
	opponent: {
		creature: {
			id: "mewtwo"
		}
	}
}

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
	
	renderer = PIXI.autoDetectRenderer();
	document.getElementById("gamescreen_inner").appendChild(renderer.view);
	stage = new PIXI.Container();
	renderer.render(stage);
	
	renderplayers();

	PIXI.loader.add([{name: "mewtwo", url:"assets/images/mewtwo/mewtwo.png"}, 
					{name: "gyarados", url:"assets/images/gyarados/gyarados-mega.gif"}, 
					{name: "cardBack", url:"assets/images/cards/cardBack.png"}]).load(function ()
	{
		playerCreatureSprite.scale.set(3, 3);
		playerCreatureSprite.anchor.y = 1;
		playerCreatureSprite.y = renderer.height;
		stage.addChild(playerCreatureSprite);

		opponentCreatureSprite.scale.set(3, 3);
		opponentCreatureSprite.anchor.x = 1;
		opponentCreatureSprite.x = renderer.width;
		stage.addChild(opponentCreatureSprite);
		stage.addChild(cardBackSprite);
		drawGameState(gameState)
		//var sprite = new PIXI.Sprite(PIXI.loader.resources["mewtwo"].texture);
		//console.log("loaded");
		//stage.addChild(sprite);
		//sprite.anchor.x = 1;
		//sprite.x = renderer.width;
		//console.log(PIXI.utils.TextureCache);
		
		//renderer.backgroundColor = 0xFFFFFF;
		//renderer.render(stage);
		//sprite = new PIXI.Sprite(PIXI.loader.resources["assets/images/mewtwo/mew2.png"].texture);
		//stage.removeChildren();
		//stage.addChild(sprite);
		//renderer.render(stage);
		renderGame();
	});


});

function updatePlayerCreature(){
	playerCreatureSprite = new PIXI.Sprite(PIXI.loader.resources["assets/images/gyarados/gyarados-mega.gif"].texture);
	console.log("updated playerCreatureSprite");
	playerCreatureSprite.scale.set(3, 3);
	playerCreatureSprite.anchor.y = 1;
	playerCreatureSprite.y = renderer.height;
	stage.addChild(playerCreatureSprite);
}

function updateOpponentCreature(){
	opponentCreatureSprite = new PIXI.Sprite(PIXI.loader.resources["assets/images/mewtwo/mew2.png"].texture);
	console.log("updated playerCreatureSprite");
	opponentCreatureSprite.scale.set(3, 3);
	opponentCreatureSprite.anchor.x = 1;
	opponentCreatureSprite.x = renderer.width;
	stage.addChild(opponentCreatureSprite);
}

function updateOpponentCards(numCards){
	//cardBackSprite = new PIXI.Sprite(PIXI.loader.resources["assets/images/cards/cardBack.png"].texture);
	stage.addChild(cardBackSprite);
}

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

function renderGame(){
	//stage.removeChildren(); //Clears the screen...by removing the children ( ͡° ͜ʖ ͡°)
	//add each sprite to be redendered
	//updatePlayerCreature();
	//updateOpponentCreature();

	renderer.render(stage);
}

function drawGameState(gameState){
	playerCreatureSprite.texture = PIXI.loader.resources[gameState.me.creature.id].texture;
	opponentCreatureSprite.texture = PIXI.loader.resources[gameState.opponent.creature.id].texture;
	//cardBackSprite.texture = PIXI.loader.resources[cardBack].texture;
}

