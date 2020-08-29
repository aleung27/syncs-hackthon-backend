var app = require("express")();
var express = require('express');

//var http = require("http").createServer(app);
var https = require('https');

var fs = require('fs');
var socket = require('socket.io')
var privateKey = fs.readFileSync('key.pem', 'utf-8');
var certificate = fs.readFileSync('cert.pem', 'utf-8');
var passphrase = '1234';
var credentials = { key: privateKey, cert: certificate, passphrase: passphrase };

//var io = require("socket.io")(http);
var httpsServer = https.createServer(credentials, app);

var io = socket(httpsServer);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

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
//    "volumes": {},
// }


var images = [];
// Store custom user sprites
var bg = "atlas"
var bgURLs = {"atlas" : "https://cdn.discordapp.com/attachments/747990497091518557/749222951865286676/networking_event-01-01.png"}

const imgURLs = [
  "https://cdn.discordapp.com/attachments/747990497091518557/749221522740346890/eva-01-01.png",
  "https://cdn.discordapp.com/attachments/747990497091518557/749240320159383642/SEAN.png",
  "https://cdn.discordapp.com/attachments/747990497091518557/749238070854942800/adam-01.png",
  "https://cdn.discordapp.com/attachments/747990497091518557/749237398046507037/judd-01.png",
]; // Please add image URLs

// Stores all the sockets
var sockets = [];
var comments = [
  {
    username: "Adam",
    comment: "Try out the comment system!",
  },
];
var rooms = ["FV12"];

var distance = function(id1, id2) {
    var user1 = users[id1];
    var user2 = users[id2];
    var temp = Math.sqrt((user1.x - user2.x)**2 + (user1.y - user2.y)**2);
    console.log("Distances"+ temp);
    return temp
}

var volumeControl = function(dist) {
    var temp = 1 / ((0.009*dist + 1)**2);
    console.log("Volume" + temp);
    return temp;
}

// Emits new position to all sockets
const emitAll = () => {
  sockets.forEach((s) => {
    s.emit("position", users);
  });
};

// Emits new position to all sockets
const emitAllImage = () => {
    sockets.forEach((s) => {
      console.log("Emit All Image")
      s.emit("image", {userData: users, bgURL: bgURLs[bg], width: WIDTH, height: HEIGHT, imageData: images});
    });
  };

  const emitAllComments = () => {
    sockets.forEach((s) => {
      s.emit("getComment", comments);
    });
  };

io.on("connection", (socket) => { // New connection start
    console.log("connected");

    console.log("new")
    io.sockets.emit("user-joined", socket.id, io.engine.clientsCount, Object.keys(io.sockets.clients().sockets));

    socket.on('signal', (toId, message) => {
        io.to(toId).emit('signal', socket.id, message);
    });

    socket.on("message", function(data){
		    io.sockets.emit("broadcast-message", socket.id, data);
    })

    socket.on('disconnect', function() {
        io.sockets.emit("user-left", socket.id);
    })

    socket.on("user-con", (asocketId) => {
        console.log("user-con")
        var userID = users.length;
        // Add the socket and the users to the list
        sockets.push(socket);
      
        //var tempVols = {};
        // for (var i = 0; i < users.length; i++) {
        //   tempVols[users[i].sid] = 0;
        // }
        // for (var i = 0; i < users.length; i++) {
        //   users[i].volumes[users[i].sid] = 0;
        // }
      
        users.push({
          id: userID,
          sid: asocketId,
          username: null,
          x: Math.random() * (WIDTH - 200) + 100,
          y: Math.random() * (HEIGHT - 200) + 100,
          userImg: imgURLs[userID % 4],
          volumes: {} // id: volume pairs
          //userImg: imgURLs[Math.random() * imgURLs.length],
        });
    
      // for ()
    
        volAdjust(userID, userID+1);
        emitAllImage();
        // Tell the connected user their id & emit all positions
        socket.emit("id", userID);
        socket.emit("position", users);
        socket.emit("getComment", comments);
    
          // Movement commands
          socket.on("move", (data) => {
          var nUsers = users.length;
          console.log("Move Received, id" + data.id);
          console.log("Users:" + users)
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
      
          volAdjust(data.id , nUsers);
          for (var i = 0; i < nUsers; i++) {
            console.log("-----------");
            console.log("I: " + i);
            console.log("SIDs: " + users[i].sid);
            for (var idaa in users[i].volumes) {
              console.log("User[i].volumes" + users[i].volumes[idaa])
            }
            socket.to(users[i].sid).emit("volume-change", users[i].volumes);
          }
          })
      
          socket.on("setName", (data) => {
            users[data.id].username = data.username;
          });
          socket.on("comment", (data) => {
            comments.push(data);
            emitAllComments();
          });
          socket.on("disconnect", () => {
            console.log("Disconnected");
            // TODO: remove user and socket
          });
    });


});



app.get("/rooms", cors(), (req, res) => {
  return res.send(rooms);
});

httpsServer.listen(PORT, () => {
  console.log("listening...");
});


var volAdjust = function(id, nUsers) {
  var vols = {};
  console.log("Adjusting Volume")
  for (var id1 = 0; id1 < nUsers; id1++) {
    for (var id2 = 0; id2 < nUsers; id2++) {
        if (id1 != id2) {
          var newVol = volumeControl(distance(id1, id2));
          users[id1].volumes[users[id2].sid] = newVol;
        }
    }
    
  }
  // for (var i = 0; i < nUsers; i++) {
  //   if (i != id) {
  //     var currVol = volumeControl(distance(id, i));
  //     users[i].volumes[users[id].sid] = currVol;
  //     vols[users[i].sid] = currVol;

  //   }
  //}
  //users[id].volumes = vols;
}