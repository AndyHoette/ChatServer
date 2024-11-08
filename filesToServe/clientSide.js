let userPFP = document.getElementById("userPFP");
let pfpSelector = document.getElementById("choosePFP");
let chatLog = document.getElementById("chatlog");
let inputField = document.getElementById("inputField");
let roomName = document.getElementById("roomName");

function clearChat(){
	chatLog.innerHTML = "";
}

function newSession(){
	sessionStorage.clear();
	sessionStorage.setItem("room", 0);
	loggedOut();
}

let socketio = io.connect();
socketio.on("connect", function(socket){
	newSession();
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
	document.getElementById("beforeLogIn").style.display = "none";
	document.getElementById("afterLogIn").style.display = "block";
	inputField.style.display = "block";
}

function loggedOut(){
	document.getElementById("beforeLogIn").style.display = "block";
	document.getElementById("afterLogIn").style.display = "none";
	roomName.innerHTML = "Welecome to the Home Page!";
	inputField.style.display = "none";
	clearChat();
}

function updatePFP(){
	socketio.emit("updatePFP", {id:socketio.id, pfp: pfpSelector.value});
	userPFP.src = "profilePictures/" + pfpSelector.value + ".png";
}
pfpSelector.addEventListener("change", updatePFP, false);
