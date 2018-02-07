/* eslint-env browser */


// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";

// current app state
let state = "lobby";

// player list
let players = [];


// network/state message handler
const processes =
{
	lobby:
	{
		"0": function(dataview)
		{
			const id_player = "";
			
			let index, char = dataview.getInt8(index = 1);
			console.log(char);
			// addchat(players[params.slice(0, sep)].alias, params.slice(sep + 1));
		},
		"4": function(dataview)
		{
			/*
			players = params.split(",").map(function(alias)
			{
				return {alias: alias};
			});
			
			renderplayers();
			*/
		},
	}
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