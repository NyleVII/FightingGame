//Main render of game screen
document.addEventListener("DOMContentLoaded", function()
{
	DOMRenderer.initialize();

	document.getElementById("chat_form").onsubmit = function(event)
	{
		event.preventDefault();
		
		const text = document.getElementById("chat_text");
		
		const buffer_text = [NetProtocol.server.CHAT];
		for(let i = 0; i < text.value.length; ++i)
			buffer_text.push(text.value.charCodeAt(i) & 0xff);
		socket.send(new Uint8Array(buffer_text));
		text.value = "";
	};

	document.getElementById("queueButton").onclick = function(event)
	{
		
		if(State.queued === true)
		{
			console.log("In queue, will cancel queue");
			socket.send(new Uint8Array([NetProtocol.server.QUEUE_LEAVE]));
		}
		else 
		{
			console.log("Attempting to join queue");
			socket.send(new Uint8Array([NetProtocol.server.QUEUE_JOIN]));
		}
	};
	
	const dom_tooltip = document.getElementById("tooltip");
	document.onmousemove = function(event)
	{
		dom_tooltip.style.left = event.clientX + 16 + "px";
		dom_tooltip.style.top = event.clientY + 16 + "px";
	};
	
	PIXI.loader.add([
		{name: "energy", url:"assets/images/energy.png"},
		{name: "deck", url:"assets/images/deck.png"},
		{name: "cardback", url:"assets/images/cardback.png"},
	]).load(function()
	{
		State.loaded.assets_misc = true;
		State.loaded_process();
	});
});