



document.addEventListener("DOMContentLoaded", function()
{
	document.getElementById("chat_form").onsubmit = function(event)
	{
		event.preventDefault();
		
		const text = document.getElementById("chat_text");
		socket.send("chat " + text.value);
		text.value = "";
	};
	
	const renderer = PIXI.autoDetectRenderer();
	document.getElementById().appendChild(renderer.view);
	
	const stage = new PIXI.Container();
	renderer.render(stage);
	
	renderplayers();
});