let socketio = io.connect();
socketio.on("connect", function(socket){
	console.log("connected");
	sessionStorage.setItem("room", 0);
});
socketio.on("message_to_client",function(data) {
	//Append an HR thematic break and the escaped HTML of the new message
	if(!data["success"] || data["room"] != sessionStorage.getItem("room")){
		return;
	}
	document.getElementById("chatlog").appendChild(document.createElement("hr"));
	let newMessage = document.createElement("p");
	newMessage.appendChild(document.createTextNode(data["username"] + ": " + data["message"]));
	document.getElementById("chatlog").appendChild(newMessage);
});

socketio.on("usernameRequestReturn", function(data) {
	//if it was successful make it the username in session storage
	if(data["success"]){
		sessionStorage.setItem("username", data["username"]);
		loggedIn();
	}
	else{
		document.getElementById("usernameInput").value = "invalid";
	}
});

function sendMessage(){
	let msg = document.getElementById("message_input").value;
	if(msg === ""){
		return;
	}
	document.getElementById("message_input").value = "";
	socketio.emit("message_to_server", {message:msg, id:socketio.id});
}

function requestUsername(){
	let newUsername = document.getElementById("usernameInput").value;
	if(newUsername === ""){
		return;
	}
	socketio.emit("usernameRequest", {username: newUsername, id:socketio.id});
}

function loggedIn(){
}
