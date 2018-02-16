/* eslint-env browser */


// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";

// current app state
let state = "lobby";

// player list
let players = {}, id_player_self;
const Cards = {};
const Creatures = {};


function read_string(dataview, index)
{
	let char, string = "";
	
	while(index < dataview.byteLength && (char = dataview.getInt8(index++)))
		string += String.fromCharCode(char);
	
	return string;
}


// network/state message handler
const processes =
{
	lobby:
	[
		// Chat message
		function(dataview)
		{
			const id_player = read_string(dataview, 1);
			const text = read_string(dataview, id_player.length + 2);
			
			addchat(players[id_player].name, text);
		},
		
		// ability data dump
		function()
		{
			
		},
		
		// card data dump
		function(dataview)
		{
			let index = 1;
			
			Cards.by_id = {};
			Cards.by_name = {};
			while(index < dataview.byteLength)
			{
				const id_card = read_string(dataview, index);
				index += id_card.length + 1;
				
				const name = read_string(dataview, index);
				index += name.length + 1;
				
				const cost = dataview.getInt8(index++);
				
				Cards.by_id[id_card] = Cards.by_name[name] = {
					id: id_card,
					name: name,
					cost: cost
				};
			}
			let cardImageArray = [];
			for(const i in Cards.by_id)
			{
				cardImageArray.push({name: i + "_card", url: "assets/images/cards/" + i + ".png"});
			}
			PIXI.loader.add(cardImageArray).load();
		},
		
		// creature data dump
		function(dataview)
		{
			let index = 1;
			
			Creatures.by_id = {};
			Creatures.by_name = {};
			while(index < dataview.byteLength)
			{
				const id_creature = read_string(dataview, index);
				index += id_creature.length + 1;
				
				const name = read_string(dataview, index);
				index += name.length + 1;
				
				const attack = dataview.getInt8(index++);
				const health = dataview.getInt8(index++);
				
				Creatures.by_id[id_creature] = Creatures.by_name[name] = {
					id: id_creature,
					name: name,
					attack: attack,
					health: health
				};
			}
		},
		
		// full player list
		function(dataview)
		{
			let index = 1;
			
			players = {};
			while(index < dataview.byteLength)
			{
				const id_player = read_string(dataview, index);
				index += id_player.length + 1;
				
				const name = read_string(dataview, index);
				index += name.length + 1;
				
				players[id_player] = {name: name};
			}
			
			renderplayers();
		},
		
		// player joined
		function(dataview)
		{
			const id_player = read_string(dataview, 1);
			players[id_player] = {name: read_string(dataview, id_player.length + 2)};
			
			addmessage(players[id_player].name + " joined the server.");
			
			renderplayers();
		},
		
		// player left
		function(dataview)
		{
			const id_player = read_string(dataview, 1);
			
			addmessage(players[id_player].name + " left the server.");
			delete players[id_player];
			
			renderplayers();
		},
		
		// successful login
		function(dataview)
		{
			id_player_self = read_string(dataview, 1);
		}
	]
};

// socket message handler
socket.onmessage = function(event)
{
	const dataview = new DataView(event.data);
	const code = dataview.getInt8(0);
	
	const process = processes[state][code];
	if(process !== undefined)
		process(dataview);
};



function addchat(alias, message)
{
	const line = document.createElement("div");
	line.className = "chat_line";
	
	const name = document.createElement("div");
	name.className = "chat_name";
	name.innerHTML = alias + ":";
	
	line.appendChild(name);
	
	// message bracket processing
	let index = 0;
	while(index < message.length)
	{
		const start = message.indexOf("[", index);
		if(start === -1)
			break;
		
		const end = message.indexOf("]", start);
		if(end === -1)
			break;
		
		const name_card = message.substring(start + 1, end);
		if(Cards.by_name[name_card] !== undefined)
		{
			const link = document.createElement("span");
			link.className = "chat_link";
			link.appendChild(document.createTextNode(name_card));
			
			line.appendChild(link);
		}
		else
			line.appendChild(document.createTextNode(message.substring(index, end + 1)));
		
		index = end + 1;
	}
	line.appendChild(document.createTextNode(message.substring(index)));
	
	// TODO(shawn): scroll to bottom automatically
	document.getElementById("chat_lines").appendChild(line);
	
	const links = document.getElementsByClassName("chat_link");
	for(let i = 0; i < links.length; ++i)
	{
		links[i].onmouseover = function(event)
		{
			const name = event.target.innerHTML;
			
			if(Cards.by_name[name] !== undefined)
			{
				document.getElementById("tooltip").classList.add("visible");
				document.getElementById("tooltip-title").innerHTML = name;
				document.getElementById("tooltip-content").innerHTML = "<div class=\"tooltip-property\"><div class=\"label\">Cost:</div>" + Cards.by_name[name].cost + "</div>";
			}
		};
		
		links[i].onmouseout = function()
		{
			document.getElementById("tooltip").classList.remove("visible");
		};
	}
}

function addmessage(message)
{
	const line = document.createElement("div");
	line.className = "chat_message";
	
	line.appendChild(document.createTextNode(message));
	
	document.getElementById("chat_lines").appendChild(line);
}

let collapsed = false;
function toggle()
{
	const players = document.getElementById("players");
	const gamescreen = document.getElementById("gamescreen");
	
	if (collapsed)
	{
		let classes;
		
		classes = players.className.split(" ");
		classes.splice(classes.indexOf("collapsed"), 1);
		players.className = classes.join(" ");
		
		classes = gamescreen.className.split(" ");
		classes.splice(classes.indexOf("collapsed"), 1);
		gamescreen.className = classes.join(" ");
	}
	else
	{
		players.className += " collapsed";
		gamescreen.className += " collapsed";
	}
	
	collapsed = !collapsed;
}