/* exported NetProtocol */


// download network protocol from server
const request = new XMLHttpRequest();
request.open("GET", "/protocol", false);
request.send(null);

const NetProtocol = JSON.parse(request.responseText);