// Require the packages we will use:
const http = require("http"),
	fs = require("fs"),
	url = require("url"),
	mime = require("mime"),
	path = require("path");

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

let idToUsernameMap = {};
let idToPfpMap = {};

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);
io.sockets.on("connection", function (socket) {
	// This callback runs when a new Socket.IO connection is established.

	socket.on('message_to_server', function (data) {
		// This callback runs when the server receives a new message from the client.
		if(!idToUsernameMap.hasOwnProperty(data["id"])){
			io.sockets.emit("message_to_client", {success: false});
			return;
		}
		console.log("message: " + data["message"]); // log it to the Node.JS outpu:
		console.log("socketId of user who sent that" + data["id"]);
		console.log(idToUsernameMap);
		io.sockets.emit("message_to_client", { success: true, message: data["message"], username: idToUsernameMap[data["id"]], room: 0, pfp: idToPfpMap[data["id"]] }) // broadcast the message to other users
	});
	
	socket.on('usernameRequest', function (data) {
		// This callback runs when the serve recieves a new username request
		console.log(idToUsernameMap);
		console.log(Object.values(idToUsernameMap));
		if(!Object.values(idToUsernameMap).includes(data["username"])){
			console.log("accepting new username: " + data["username"] + ". For user id: " + data["id"]);
			console.log(idToUsernameMap);
			idToUsernameMap[data["id"]] = data["username"];
			idToPfpMap[data["id"]] = "turtle";
			io.sockets.emit("usernameRequestReturn", { success: true, username: data["username"]});
		}else{
			console.log("rejecting new username: " + data["username"]);
			io.sockets.emit("usernameRequestReturn", { success: false});
		}
	});
	socket.on('updatePFP', function(data) {
		idToPfpMap[data["id"]] = data["pfp"];
	});
});
