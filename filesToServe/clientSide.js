let socketio = io.connect();
socketio.on("message_to_client",function(data) {
    //Append an HR thematic break and the escaped HTML of the new message
    document.getElementById("chatlog").appendChild(document.createElement("hr"));
    document.getElementById("chatlog").appendChild(document.createTextNode(data['message']));
});

function sendMessage(){
    let msg = document.getElementById("message_input").value;
    socketio.emit("message_to_server", {message:msg});
}
