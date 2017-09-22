/* eslint-env browser */


// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");

// current app state
let state = "lobby";

// player list
let players = [];


// network/state message handler
const processes =
{
	lobby:
	{
		players: function(params)
		{
			players = params.split(",").map(function(alias)
			{
				return {alias: alias};
			});
			
			renderplayers();
		},
		chat: function(params)
		{
			const sep = params.indexOf(" ");
			
			addchat(players[params.slice(0, sep)].alias, params.slice(sep + 1));
		}
	}
};

// socket message handler
socket.onmessage = function(event)
{
	const sep = event.data.indexOf(" ");
	
	let type, params;
	if (sep === -1)
	{
		type = event.data;
		params = "";
	}
	else
	{
		type = event.data.slice(0, sep);
		params = event.data.slice(sep + 1);
	}
	
	const process = processes[state][type];
	
	if (process !== undefined)
		process(params);
};



function addchat(alias, message)
{
	const line = document.createElement("div");
	line.className = "chat_line";
	
	const name = document.createElement("div");
	name.className = "chat_name";
	name.innerHTML = alias + ":";
	
	line.appendChild(name);
	line.innerHTML += message;
	
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