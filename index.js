var app = require("express")();
var http = require("http").createServer(app);
var io = require("socket.io")(http);

const cors = require("cors");

const PORT = 3030;
const WIDTH = 1200;
const HEIGHT = 800;

var users = [];
// Users is of the form
// {
//    "id": id,
//    "username": username
//    "x": x,
//    "y": y,
// }

// Store custom user sprites
var imgURLs = [
  "https://www.w3schools.com/images/lamp.jpg",
  "https://www.w3schools.com/images/lamp.jpg",
  "https://www.w3schools.com/images/lamp.jpg",
  "https://www.w3schools.com/images/lamp.jpg",
  "https://www.w3schools.com/images/lamp.jpg",
  "https://www.w3schools.com/images/lamp.jpg",
]; // Please add image URLs

// Stores all the sockets
var sockets = [];

var rooms = ["FV12"];

// Emits new position to all sockets
const emitAll = () => {
  sockets.forEach((s) => {
    s.emit("position", users);
  });
};

http.listen(PORT, () => {
  console.log("listening...");
});

io.on("connection", (socket) => {
  console.log("connected");
  var userID = users.length;
  // Add the socket and the users to the list
  sockets.push(socket);
  users.push({
    id: userID,
    username: null,
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    userImg: imgURLs[userID],
  });

  // Tell the connected user their id & emit position
  socket.emit("id", userID);
  socket.emit("position", users);

  // Movement commands
  socket.on("move", (data) => {
    switch (data.direction) {
      case "left":
        users[data.id].x -= 5;
        emitAll();
        break;
      case "right":
        users[data.id].x += 5;
        emitAll();
        break;
      case "up":
        users[data.id].y -= 5;
        emitAll();
        break;
      case "down":
        users[data.id].y += 5;
        emitAll();
        break;
    }
  });

  socket.on("setName", (data) => {
    users[data.id].username = data.username;
  });

  socket.on("disconnect", () => {
    console.log("Disconnected");
    // TODO: remove user and socket
  });
});

app.get("/rooms", cors(), (req, res) => {
  return res.send(rooms);
});
