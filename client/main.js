/* eslint-env browser */


// socket connection
const socket = new WebSocket("ws://" + window.location.hostname + ":3000");
socket.binaryType = "arraybuffer";

// current app state
let state = "lobby";

// player list
let players = {}, id_player_self;


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
		function()
		{
			
		},
		
		// creature data dump
		function()
		{
			
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
			
			renderplayers();
		},
		
		// player left
		function(dataview)
		{
			delete players[read_string(dataview, 1)];
			
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