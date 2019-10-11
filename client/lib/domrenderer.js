/* exported DOMRenderer */


function cb_click_friend(event)
{
	const id_player = event.target.dataset.id;

	if(id_player !== State.id_player_chat)
	{
		DOMRenderer.dom_friends_chattitle.innerHTML = State.friends_by_id[id_player].name;
		DOM.removeclass(DOMRenderer.dom_friends_chatpanel, "hidden");
		State.id_player_chat = id_player;
	}
	else
	{
		DOM.addclass(DOMRenderer.dom_friends_chatpanel, "hidden");
		State.id_player_chat = null;
	}
}


const DOMRenderer = {
	ready: false,
	gamerenderer: null,

	jobqueue: [],

	initialize: function()
	{
		DOMRenderer.ready = true;


		/* -- FIND DOM ELEMENTS -- */
		DOMRenderer.dom_page = document.getElementById("page");
		// DOMRenderer.dom_gamescreen = document.getElementById("gamescreen");
		// DOMRenderer.dom_tooltip = document.getElementById("tooltip");

		DOMRenderer.dom_friends_tab = document.getElementById("friends-tab");
		DOMRenderer.dom_friends_container = document.getElementById("friends-container");
		DOMRenderer.dom_friends_listtitle = document.getElementById("friends-listtitle");
		DOMRenderer.dom_friends_list = document.getElementById("friends-list");
		DOMRenderer.dom_friends_chatpanel = document.getElementById("friends-chatpanel");
		DOMRenderer.dom_friends_chattitle = document.getElementById("friends-chattitle");
		DOMRenderer.dom_friends_chatform = document.getElementById("friends-chatform");
		DOMRenderer.dom_friends_chatform_input = document.getElementById("friends-chatform-input");

		DOMRenderer.dom_logout = document.getElementById("btn_logout");



		DOMRenderer.gamerenderer = PIXI.autoDetectRenderer();
		// document.getElementById("gamescreen_inner").appendChild(DOMRenderer.gamerenderer.view);


		/* -- EVENTS -- */
		DOMRenderer.dom_page.onclick = function()
		{
			DOM.addclass(DOMRenderer.dom_friends_container, "hidden");
			DOM.removeclass(DOMRenderer.dom_friends_tab, "hidden");
		};

		DOMRenderer.dom_friends_tab.onclick = function(event)
		{
			DOM.addclass(DOMRenderer.dom_friends_tab, "hidden");
			DOM.removeclass(DOMRenderer.dom_friends_container, "hidden");
			event.stopPropagation();
		};

		DOMRenderer.dom_friends_container.onclick = function(event)
		{
			event.stopPropagation();
		};

		DOMRenderer.dom_logout.onclick = function()
		{
			socket.send(new Uint8Array([NetProtocol.server.LOGOUT]));
		};

		DOMRenderer.dom_friends_chatform.onsubmit = function(event)
		{
			event.preventDefault();

			const text = DOMRenderer.dom_friends_chatform_input.value;
			if(text.charAt(0) === "/")
			{
				const components = text.split(" ");

				const command = components[0].slice(1);
				const args = components.slice(1);

				// TODO(shawn): make this less hardcoded
				if(command === "end")
					socket.send(new Uint8Array([NetProtocol.server.GAME, NetProtocol.server.game.ENDTURN]));
				else if(command === "login")
				{
					const buffer = [NetProtocol.server.LOGIN];
					BufferWriter.string(buffer, args[0]);
					socket.send(new Uint8Array(buffer));
				}
			}
			else if(text !== "")
			{
				const buffer_text = [NetProtocol.server.CHAT];
				BufferWriter.string(buffer_text, text);
				socket.send(new Uint8Array(buffer_text));
			}

			DOMRenderer.dom_friends_chatform_input.value = "";
		};

		// document.getElementById("queueButton").onclick = function()
		// {
		// 	if(State.queued === true)
		// 	{
		// 		Log.message("In queue, will cancel queue");
		// 		socket.send(new Uint8Array([NetProtocol.server.QUEUE_LEAVE]));
		// 	}
		// 	else
		// 	{
		// 		Log.message("Attempting to join queue");
		// 		socket.send(new Uint8Array([NetProtocol.server.QUEUE_JOIN]));
		// 	}
		// };

		// const dom_tooltip = document.getElementById("tooltip");
		// document.onmousemove = function(event)
		// {
		// 	dom_tooltip.style.left = event.clientX + 16 + "px";
		// 	dom_tooltip.style.top = event.clientY + 16 + "px";
		// };

		// perform any queued jobs
		while(DOMRenderer.jobqueue.length > 0)
		{
			const job = DOMRenderer.jobqueue.shift();
			DOMRenderer[job.method].apply(DOMRenderer, job.arguments || []);
		}
	},

	update_friendslist: function()
	{
		if(DOMRenderer.ready)
		{
			DOMRenderer.dom_friends_list.innerHTML = "";

			let num_online = 0;
			for(const id_player_friend in State.friends_by_id)
			{
				const friend = State.friends_by_id[id_player_friend];

				if(friend.online)
				{
					const dom_friend = document.createElement("div");
					dom_friend.className = "friend online";
					dom_friend.dataset.id = id_player_friend;
					dom_friend.innerHTML = `<div class="presence"></div> ${friend.name}`;

					dom_friend.onclick = cb_click_friend;
					
					DOMRenderer.dom_friends_list.appendChild(dom_friend);

					num_online++;
				}
			}

			for(const id_player_friend in State.friends_by_id)
			{
				const friend = State.friends_by_id[id_player_friend];

				if(!friend.online)
				{
					const dom_friend = document.createElement("div");
					dom_friend.className = "friend offline";
					dom_friend.dataset.id = id_player_friend;
					dom_friend.innerHTML = `<div class="presence"></div> ${friend.name}`;
					
					DOMRenderer.dom_friends_list.appendChild(dom_friend);
				}
			}
			
			DOMRenderer.dom_friends_listtitle.innerHTML = num_online === 1 ? "<span class=\"highlight\">1</span> Friend Online" : `<span class="highlight">${num_online}</span> Friends Online`;
		}
		else
			DOMRenderer.jobqueue.push({method: "update_friendslist"});
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

				dom_link.onmouseover = function(event)
				{
					const name = event.target.innerHTML;
					const card = Data.cards.by_name[name];

					if(card !== undefined)
					{
						DOM.addclass(DOMRenderer.dom_toolip, "visible");
						document.getElementById("tooltip-title").innerHTML = name;
						document.getElementById("tooltip-content").innerHTML = "<div class=\"tooltip-property\"><div class=\"label\">Cost:</div>" + card.cost + "<div>" + card.text + "</div></div>";
					}
				};
				dom_link.onmouseout = function()
				{
					DOM.removeclass(DOMRenderer.dom_toolip, "visible");
				};

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
		if(DOMRenderer.ready)
		{
			// const dom_message = document.createElement("div");
			// dom_message.className = "chat_message";

			// dom_message.appendChild(document.createTextNode(message));

			// DOMRenderer.dom_chatlines.appendChild(dom_message);
		}
		else
			DOMRenderer.jobqueue.push({method: "update_friendslist", arguments: [message]});
	}
};
