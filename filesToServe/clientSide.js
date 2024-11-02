let socketio = io.connect();
socketio.on("connect", function(socket){
	localStorage.setItem("socketId", socketio.id);
});
socketio.on("message_to_client",function(data) {
	//Append an HR thematic break and the escaped HTML of the new message
	document.getElementById("chatlog").appendChild(document.createElement("hr"));
	let newMessage = document.createElement("p");
	newMessage.appendChild(document.createTextNode(data["username"] + ": " + data["message"]));
	document.getElementById("chatlog").appendChild(newMessage);
});

function sendMessage(){
	let msg = document.getElementById("message_input").value;
	if(msg === ""){
		return;
	}
	let mySocketId = localStorage.getItem("socketId");
	document.getElementById("message_input").value = "";
	socketio.emit("message_to_server", {message:msg, id:mySocketId});
}
