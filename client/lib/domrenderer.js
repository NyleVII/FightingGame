/* exported DOMRenderer */

const DOMRenderer = {
	ready: false,
	
	gamerenderer: null,
	
	initialize: function()
	{
		DOMRenderer.ready = true;
		
		DOMRenderer.dom_chatlines = document.getElementById("chat_lines");
		DOMRenderer.dom_gamescreen = document.getElementById("gamescreen");
		DOMRenderer.dom_players = document.getElementById("players");
		DOMRenderer.dom_playerlist = document.getElementById("playerlist");
		DOMRenderer.dom_tooltip = document.getElementById("tooltip");
		DOMRenderer.dom_usertext = document.getElementById("usertext");
		
		DOMRenderer.gamerenderer = PIXI.autoDetectRenderer();
		document.getElementById("gamescreen_inner").appendChild(DOMRenderer.gamerenderer.view);
	},
	
	callback_link_mouseover: function(event)
	{
		const name = event.target.innerHTML;
		
		if(Data.cards.by_name[name] !== undefined)
		{
			DOMRenderer.dom_tooltip.classList.add("visible");
			document.getElementById("tooltip-title").innerHTML = name;
			document.getElementById("tooltip-content").innerHTML = "<div class=\"tooltip-property\"><div class=\"label\">Cost:</div>" + Data.cards.by_name[name].cost + "</div>";
		}
	},
	
	callback_link_mouseout: function()
	{
		DOMRenderer.dom_tooltip.classList.remove("visible");
	},
	
	playerlist: function()
	{
		if(!DOMRenderer.ready)
			return;
		
		DOMRenderer.dom_playerlist.innerHTML = "";
		
		for(const i in Data.players)
		{
			const dom_player = document.createElement("div");
			dom_player.className = "player";
			dom_player.innerHTML = Data.players[i].name;
			
			DOMRenderer.dom_playerlist.appendChild(dom_player);
		}
	},
	
	addchat: function(name, message)
	{
		if(!DOMRenderer.ready)
			return;
		
		const dom_line = document.createElement("div");
		dom_line.className = "chat_line";
		
		const dom_name = document.createElement("div");
		dom_name.className = "chat_name";
		dom_name.innerHTML = name + ":";
		
		dom_line.appendChild(dom_name);
		
		// message bracket processing
		let index = 0;
		while(index < message.length)
		{
			const index_start = message.indexOf("[", index);
			if(index_start === -1)
				break;
			
			const index_end = message.indexOf("]", index_start);
			if(index_end === -1)
				break;
			
			const name_card = message.substring(index_start + 1, index_end);
			if(Data.cards.by_name[name_card] !== undefined)
			{
				const dom_link = document.createElement("span");
				dom_link.className = "chat_link";
				dom_link.appendChild(document.createTextNode(name_card));
				
				dom_link.onmouseover = DOMRenderer.callback_link_mouseover;
				dom_link.onmouseout = DOMRenderer.callback_link_mouseout;
				
				dom_line.appendChild(dom_link);
			}
			else
				dom_line.appendChild(document.createTextNode(message.substring(index, index_end + 1)));
			
			index = index_end + 1;
		}
		dom_line.appendChild(document.createTextNode(message.substring(index)));
		
		// TODO(shawn): scroll to bottom automatically
		DOMRenderer.dom_chatlines.appendChild(dom_line);
	},
	
	addmessage: function(message)
	{
		if(!DOMRenderer.ready)
			return;
		
		const dom_message = document.createElement("div");
		dom_message.className = "chat_message";
		
		dom_message.appendChild(document.createTextNode(message));
		
		DOMRenderer.dom_chatlines.appendChild(dom_message);
	},
	
	usertext: function(text)
	{
		if(!DOMRenderer.ready)
			return;
		
		DOMRenderer.dom_usertext.innerText = text;
	},
	
	gamescreen_hide: function()
	{
		if(!DOMRenderer.ready)
			return;
		
		DOMRenderer.dom_players.classList.remove("collapsed");
		DOMRenderer.dom_gamescreen.classList.remove("collapsed");
	},
	
	gamescreen_show: function()
	{
		if(!DOMRenderer.ready)
			return;
		
		DOMRenderer.dom_players.classList.add("collapsed");
		DOMRenderer.dom_gamescreen.classList.add("collapsed");
	}
};