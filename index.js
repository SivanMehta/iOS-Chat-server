var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var deckLogic = require('./deckLogic')
const path = require('path')

var userList = [];

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

    console.log("Users: ", userList)
    io.emit("userList", userList)
  });

  clientSocket.on('chatMessage', function(clientNickname, message){
    console.log(message)
    var currentDateTime = new Date().toLocaleString();
    io.emit('newChatMessage', clientNickname, message, currentDateTime);
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

  clientSocket.on("startGame", () => {
    deckLogic.getStartingHands((hands) => {
      io.emit('startedGame', {
        hands: hands
      })
    })
  })
});
