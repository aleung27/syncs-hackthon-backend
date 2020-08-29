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

  // Add the socket and the users to the list
  sockets.push(socket);
  users.push({
    id: users.length,
    username: null,
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
  });

  // Tell the connected user their id & emit all positions
  socket.emit("id", users.length - 1);
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
