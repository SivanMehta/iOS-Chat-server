var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var deckLogic = require('./deckLogic')
const path = require('path')

var userList = []
var currentHands = {}

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'index.html'));
});

const port = process.env.PORT || 3000

http.listen(port, function(){
  console.log('Listening on ' + port);
});

io.on('connection', function(clientSocket) {

  clientSocket.on('disconnect', () => {
    console.log(clientSocket.id, "disconnected")

    userList = userList.filter(user => user.id !== clientSocket.id)
    currentHands = {}

    console.log("Users: ", userList)
    io.emit("userList", userList)
  });

  clientSocket.on('made battle move', () => {
    io.emit('made battle move')
  })

  clientSocket.on('made war move', () => {
    io.emit('made war move')
  });


  clientSocket.on("connectUser", function(clientNickname) {
      // only allow 2 users at most
      if(userList.length < 2) {
        var userInfo = {};
        var foundUser = false;
        for (var i = 0; i < userList.length; i++) {
          if (userList[i]["nickname"] == clientNickname) {
            userList[i]["isConnected"] = true
            userList[i]["id"] = clientSocket.id;
            userInfo = userList[i];
            foundUser = true;
            break;
          }
        }

        if (!foundUser) {
          userInfo["id"] = clientSocket.id;
          userInfo["nickname"] = clientNickname;
          userInfo["isConnected"] = true
          userList.push(userInfo);
        }

        console.log("Users: ", userList)
        io.emit("userList", userList)
        io.emit("userConnectUpdate", userInfo)
    } else {
      io.to(clientSocket.id).emit('denyAccess')
    }
  });

  clientSocket.on("startedGame", () => {
    if(Object.keys(currentHands).length == 0) { // there is no game in progress
      console.log("Started game between " + userList.map(user => user.nickname))
      deckLogic.getStartingHands((hands) => {
        [0, 1].forEach(i => {
          io.to(userList[i].id).emit('startedGame', hands[i])
          currentHands[userList[i].id] = hands[i]
          console.log("persisting hand for ", userList[i].id)
        })
      })
    } else { // someone is joining the game
      console.log("fetching hand for ", clientSocket.id)
      io.to(clientSocket.id).emit('join game', currentHands[clientSocket.id])
    }
  })
});
