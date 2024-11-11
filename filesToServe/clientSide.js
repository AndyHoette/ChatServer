let userPFP = document.getElementById("userPFP");
let pfpSelector = document.getElementById("choosePFP");
let chatLog = document.getElementById("chatlog");
let inputField = document.getElementById("inputField");
let roomName = document.getElementById("roomName");
let logOutButton = document.getElementById("logOutButton");
let createAccountButton = document.getElementById("createAccountButton");
let sendMessageButton = document.getElementById("sendMessageButton");
let createRoomButton = document.getElementById("createRoomButton");
let newRoomPassword = document.getElementById("newRoomPassword");
let newRoomName = document.getElementById("newRoomName");
let listOfRooms = document.getElementById("listOfRooms");
let actionBar = document.getElementById("actions");
let listOfUsers = document.getElementById("listOfUsers");
let kickButton = document.getElementById("kickButton");
let banButton = document.getElementById("banButton");
let adminButton = document.getElementById("adminButton");
let dmButton = document.getElementById("dmButton");


function clearChat(){
	chatLog.innerHTML = "";
}

//Session Function 
function newSession(){
	sessionStorage.clear();
	sessionStorage.setItem("room", 0);
	loggedOut();
}

//Function managing kicks
function kicked(){
	socketio.emit("requestToJoinRoom", {roomNumber: "0", password: "", userId: socketio.id, oldRoomNumber: sessionStorage.getItem("room")});
	listOfUsers.innerHTML = "";
}

let socketio = io.connect();
socketio.on("connect", function(socket){
	newSession();
	//console.log("requesting all rooms");
	socketio.emit("listRooms", {});
});

socketio.on("roomListed", function(data){
	//console.log(data);
});

socketio.on("message_to_client",function(data) {
	//Append an HR thematic break and the escaped HTML of the new message
	//console.log("recieved a message");
	//console.log(data);
	if(!data["success"]){
		return;
	}
	let newMessage = document.createElement("div");
	newMessage.appendChild(document.createElement("hr"));
	let pfpForMessage = document.createElement("img");
	pfpForMessage.width = "30";
	pfpForMessage.height = "30";
	pfpForMessage.src = "profilePictures/" + data["pfp"] + ".png";
	pfpForMessage.alt = "pfp";
	newMessage.appendChild(pfpForMessage);
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


//Function that changes the Roomname whenever a user creates a new room
function updateRoomName(newName){
	document.getElementById("roomName").innerHTML = "Welcome to " + newName + "!";
}

socketio.on("joinedRoom", function(data){
	if(!data["success"]){
		console.log(data["reason"]);
		return;
	}
	console.log("join another room");
	sessionStorage.setItem("room", data["roomNumber"]);
	updateRoomName(data["roomName"]);
	clearChat();
});

socketio.on("usersChanged", function(data){
	//console.log(data);
});

socketio.on("kicked", function(data){
	kicked();
});

socketio.on("directMessage", function(data){
	socketio.emit("requestToJoinRoom", {roomNumber: data["roomNumber"], password: "", userId: socketio.id, oldRoomNumber: sessionStorage.getItem("room")});
});

socketio.on("roomCreated", function(data) {
	//console.log("Create room with name: " + data["roomName"] + ". Needs Password? " + data["hasPassword"]);
	let newRoomListing = document.createElement("div");
	newRoomListing.classList.add("roomListing");
	let newRoomListingTitle = document.createElement("p");
	newRoomListingTitle.innerHTML = data["roomName"];
	newRoomListing.appendChild(newRoomListingTitle);
	let newRoomListingInput = document.createElement("input");
	newRoomListingInput.type = "text";
	newRoomListingInput.classList.add("joinRoomPassword");
	if(!data["hasPassword"]){
		newRoomListingInput.style.display = "none";
	}
	newRoomListing.appendChild(newRoomListingInput);
	let newRoomListingJoinButton = document.createElement("button");
	newRoomListingJoinButton.classList.add("joinRoomButton");
	newRoomListingJoinButton.innerHTML = "Join";
	newRoomListingJoinButton.value = data["roomId"];
	newRoomListing.appendChild(newRoomListingJoinButton);
	listOfRooms.appendChild(newRoomListing);
	newRoomListingJoinButton.setAttribute("onclick",'joinRoom(this)');
});

socketio.on("clearUsers", function(data){
	listOfUsers.innerHTML = "";
	actionBar.style.display = "none";
});

socketio.on("addUser", function(data){
	//console.log(data);
	let myButton = document.createElement("button");
	myButton.innerHTML = data["username"];
	myButton.value = data["userId"];
	myButton.setAttribute("onclick", "setUpAction(this)");
	listOfUsers.appendChild(myButton);
});

socketio.on("forceJoin", function(data){
	socketio.emit("requestToJoinRoom", {roomNumber: data["roomNumber"], password: "", userId: socketio.id, oldRoomNumber: sessionStorage.getItem("room")});
});

//Create a function for all the actions to work
function setUpAction(buttonThatWasPressed){
	actionBar.style.display="block";
	document.getElementById("affectedUser").innerHTML = buttonThatWasPressed.innerHTML;
	idAffected = buttonThatWasPressed.value;
	kickButton.value = idAffected;
	banButton.value = idAffected;
	adminButton.value = idAffected;
	dmButton.value = idAffected;
}

//Get the messenge sent by user and sends the message in the room
function sendMessage(){
	let msg = document.getElementById("message_input").value;
	if(msg === ""){
		return;
	}
	document.getElementById("message_input").value = "";
	socketio.emit("message_to_server", {message:msg, id:socketio.id, roomNumber: sessionStorage.getItem("room")});
}


function requestUsername(){
	let newUsername = document.getElementById("usernameInput").value;
	if(newUsername === ""){
		return;
	}
	socketio.emit("usernameRequest", {username: newUsername, id:socketio.id});
}

// Login Function
function loggedIn(){
	document.getElementById("beforeLogIn").style.display = "none";
	document.getElementById("afterLogIn").style.display = "block";
	inputField.style.display = "block";
	document.getElementById("createRoom").style.display = "block";
	socketio.emit("requestToJoinRoom", {roomNumber: 0, password: "", userId: socketio.id, oldRoomNumber: sessionStorage.getItem("room")});
}
// Logout Function
function loggedOut(){
	document.getElementById("beforeLogIn").style.display = "block";
	document.getElementById("afterLogIn").style.display = "none";
	roomName.innerHTML = "Welecome to the Home Page!";
	inputField.style.display = "none";
	document.getElementById("usernameInput").value = "";
	document.getElementById("newRoomName").value = "";
	document.getElementById("newRoomPassword").value = "";
	document.getElementById("createRoom").style.display = "none";
	clearChat();
	kicked();
}
// Choosing PFP Function
function updatePFP(){
	socketio.emit("updatePFP", {id:socketio.id, pfp: pfpSelector.value});
	userPFP.src = "profilePictures/" + pfpSelector.value + ".png";
}

//Create the rooms with optional password
function createRoom(){
	console.log("Creating Room ");
	console.log(newRoomName.value);
	socketio.emit("createRoom", {id: socketio.id, roomName: newRoomName.value, password: newRoomPassword.value}); 
	newRoomPassword.value = "";
	newRoomName.value = "";
}

//Join a room that was clicked and if a password is needed, you must enter the right password to join
function joinRoom(buttonThatWasClicked){
	//console.log(buttonThatWasClicked.value);
	passwordAttempt = buttonThatWasClicked.parentNode.childNodes[1].value;
	//console.log(passwordAttempt);
	socketio.emit("requestToJoinRoom", {roomNumber: buttonThatWasClicked.value, password: passwordAttempt, userId: socketio.id, oldRoomNumber: sessionStorage.getItem("room")});
}

//Function to kick from room
function requestKick(buttonThatWasClicked){
	userToKick = buttonThatWasClicked.value;
	socketio.emit("requestToKickUser", {"user": userToKick, "room":sessionStorage.getItem("room")});
}

//Function to ban from room
function requestBan(buttonThatWasClicked){
	userToBan = buttonThatWasClicked.value;
	socketio.emit("requestToBanUser", {"user": userToBan, "room":sessionStorage.getItem("room")});
}
//Function to give admin to user
function requestAdmin(buttonThatWasClicked){
	userToAdmin = buttonThatWasClicked.value;
	//console.log("requestingAdmin");
	socketio.emit("requestToAdminUser", {"user": userToAdmin, "room":sessionStorage.getItem("room")});
}
//Function to DM someone who is in the same room
function requestDM(buttonThatWasClicked){
	userToDM = buttonThatWasClicked.value;
	socketio.emit("requestToDM", {"user": userToDM, "room":sessionStorage.getItem("room")});
}

createRoomButton.addEventListener("click", createRoom, false);
pfpSelector.addEventListener("change", updatePFP, false);
logOutButton.addEventListener("click", loggedOut, false);
createAccountButton.addEventListener("click", requestUsername, false);
sendMessageButton.addEventListener("click", sendMessage, false);
