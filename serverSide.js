// Require the packages we will use:
const http = require("http"),
	fs = require("fs"),
	url = require("url"),
	mime = require("mime"),
	path = require("path");

class room{
	constructor(owner, roomName, password){
		this.admins = [owner];
		this.hasPassword = password !== "";
		if(password !== ""){
			this.password = password;
		}
		this.bannedUsers = [];
		this.name = roomName;
		this.currentUsers = [];
	}
}


const port = 3456;
const file = "filesToServe/index.html";
// Listen for HTTP connections.  This is essentially a miniature static file server that only serves our one file, client.html, on port 3456:
const server = http.createServer(function (req, resp) {
	let filename = path.join(__dirname, "filesToServe", url.parse(req.url).pathname);
	if(url.parse(req.url).pathname=="/"){
		filename = path.join(__dirname, "filesToServe", "/index.html");
	}
	(fs.exists || path.exists)(filename, function(exists){
		if (exists) {
			fs.readFile(filename, function(err, data){
				if (err) {
					// File exists but is not readable (permissions issue?)
					resp.writeHead(500, {
						"Content-Type": "text/plain"
					});
					resp.write("Internal server error: could not read file");
					resp.end();
					return;
				}

				// File exists and is readable
				var mimetype = mime.getType(filename);
				resp.writeHead(200, {
					"Content-Type": mimetype
				});
				resp.write(data);
				resp.end();
				return;
			});
		}else{
			// File does not exist
			resp.writeHead(404, {
				"Content-Type": "text/plain"
			});
			resp.write("Requested file not found: "+filename);
			resp.end();
			return;
		}
	});
});
server.listen(port);

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
	wsEngine: 'ws'
});
let numberToRoomMap = {};
let roomCounter = 0;
let dmCounter = 0;
const dmConstant = 1000000;
let homeRoom = new room("", "Home Page" ,"");
numberToRoomMap[roomCounter] = homeRoom;
roomCounter++;
let idToUsernameMap = {};
let idToPfpMap = {};
function hasAdmin(room, userId){
	return numberToRoomMap[room].admins.includes(userId);
}
// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
	// This callback runs when a new Socket.IO connection is established.
	//console.log(roomCounter);
	socket.join("0");
	socket.on('message_to_server', function (data) { //requires id roomNumber and message
		// This callback runs when the server receives a new message from the client.
		if(!idToUsernameMap.hasOwnProperty(data["id"])){
			io.sockets.emit("message_to_client", {success: false});
			return;
		}
		//console.log("message: " + data["message"]); // log it to the Node.JS outpu:
		//console.log("socketId of user who sent that" + data["id"]);
		//console.log(idToUsernameMap);
		console.log("Attmepting to send message only to ");
		console.log(data["roomNumber"]);
		io.in(data["roomNumber"]).emit("message_to_client", { success: true, message: data["message"], username: idToUsernameMap[data["id"]], pfp: idToPfpMap[data["id"]] }) // broadcast the message to other users
	});

	socket.on('usernameRequest', function (data) { //requires id and username
		// This callback runs when the serve recieves a new username request
		//console.log(idToUsernameMap);
		//console.log(Object.values(idToUsernameMap));
		if(!Object.values(idToUsernameMap).includes(data["username"])){
			//console.log("accepting new username: " + data["username"] + ". For user id: " + data["id"]);
			//console.log(idToUsernameMap);
			idToUsernameMap[data["id"]] = data["username"];
			idToPfpMap[data["id"]] = "turtle";
			socket.emit("usernameRequestReturn", { success: true, username: data["username"]});
			homeRoom.currentUsers.push(socket.id);
		}else{
			//console.log("rejecting new username: " + data["username"]);
			socket.emit("usernameRequestReturn", { success: false}); //io emit equiv socket.to(socketId) socket.to(roomName)
		}
	});
	socket.on('updatePFP', function(data) { //requires id and pfp
		idToPfpMap[data["id"]] = data["pfp"];
	});
	socket.on("listRooms", function(data) { //meant to be used when a user first logs in to get them caught up to speed requires nothing
		console.log("i have " + roomCounter + " rooms to show");
		for(let i = 1; i<roomCounter; i++){
			console.log("trying to emit " + i);
			socket.emit("roomCreated", {roomName: numberToRoomMap[i].name, needsPassword: numberToRoomMap[i].hasPassword, roomId: i});
		}
	});
	socket.on("createRoom", function(data) { //tells all users to update their list of rooms requires id, roomName, and password
		let newRoom = new room(data["id"], data["roomName"], data["password"]);
		numberToRoomMap[roomCounter] = newRoom;
		io.sockets.emit("roomCreated", {roomName: data["roomName"], hasPassword: newRoom.hasPassword, roomId: roomCounter}); 
		roomCounter++;
	});
	socket.on("requestToJoinRoom", function(data) { //requires roomNumber, userId, password, and oldRoomNumber
		let roomToLeave = numberToRoomMap[data["oldRoomNumber"]];
		let roomToJoin = numberToRoomMap[data["roomNumber"]];
		if(roomToJoin.bannedUsers.includes(data["userId"])){
			io.sockets.emit("joinedRoom", {success: false, reason: "banned"});
			return;
		}
		if(roomToJoin.hasPassword){
			if(roomToJoin.password != data["password"]){
				io.sockets.emit("joinedRoom", {success: false, reason: "auth fail"});
				return;
			}
		}
		console.log(data["userId"]);
		console.log(roomToJoin.currentUsers);
		roomToJoin.currentUsers.push(data["userId"]);
		console.log(roomToJoin.currentUsers);
		numberToRoomMap[data["oldRoomNumber"]].currentUsers = numberToRoomMap[data["oldRoomNumber"]].currentUsers.filter((item) => item !==socket.id);
		//console.log(homeRoom.currentUsers);
		socket.join(data["roomNumber"]);
		socket.leave(data["oldRoomNumber"]);
		socket.emit("joinedRoom", {success: true, roomNumber: data["roomNumber"], roomName: roomToJoin.name});	
		socket.to(data["oldRoomNumber"]).emit("clearUsers", {});
		for(let i = 0; i<roomToLeave.currentUsers.length; i++){
			socket.to(data["oldRoomNumber"]).emit("addUser", {"userId": roomToLeave.currentUsers[i], "username": idToUsernameMap[roomToLeave.currentUsers[i]]});
		}
		io.in(data["roomNumber"]).emit("clearUsers", {});
		for(let i = 0; i<roomToJoin.currentUsers.length; i++){
			io.to(data["roomNumber"]).emit("addUser", {
				"username": idToUsernameMap[roomToJoin.currentUsers[i]],
				"type": "addUser",
				"userId": roomToJoin.currentUsers[i]
			});
		}
		//socket.to(data["oldRoomNumber"]).emit("usersChanged", {"userIds" : numberToRoomMap[data["oldRoomNumber"]].currentUsers});
		//io.in(data["roomNumber"]).emit("usersChanged", {"userIds": roomToJoin.currentUsers});
	});
	socket.on("requestToKickUser", function(data){ //requires room and user
		if(!hasAdmin(data["room"], socket.id)){
			return;
		}
		io.to(data["user"]).emit("kicked", {});
	});
	socket.on("requestToBanUser", function(data){ //requires room and user
		if(!hasAdmin(data["room"], socket.id)){
			return;
		}
		numberToRoomMap[data["room"]].bannedUsers.push(data["user"]);
		io.to(data["user"]).emit("kicked", {});
	});
	socket.on("requestToAdmin", function(data){ //requires room and user
		if(!hasAdmin(data["room"], socket.id)){
			return;
		}
		numberToRoomMap[data["room"]].admins.push(data["user"]);
	});
	socket.on("requestToDM", function(data){ //requires user
		let newRoom = new room(socket.id, "Personal DM", "");
		numberToRoomMap[dmCounter+dmConstant] = newRoom;
		socket.emit("forceJoin", {roomNumber: dmCounter+dmConstant});
		io.to(data["user"]).emit("forceJoin", {"roomNumber": dmCounter+dmConstant});
		dmCounter++;
	});
});
