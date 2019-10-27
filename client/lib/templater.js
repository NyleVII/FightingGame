let loginHTML = '<form class="login" action=""><div class="login-input">	<div><label>Username:</label></div>	<input type="text" id="username" required>	<div><label>Password:</label></div>	<input type="password" id="password" required></div>  <div>	  <input id="login-submit" type="submit" value="Log In">  </div></div></form>'
let listeners = "";

let targetContent = {
	html: loginHTML,
	listeners: listeners
};

function updateTarget(targetid, targetContent){
	document.getElementById(targetid).innerHTML = targetContent.html;
}