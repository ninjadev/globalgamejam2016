var http = require('http');
var server = http.createServer(function(request, response) {
});

server.listen(1234, function() {
  console.log((new Date()) + ' Server is listening on port 1234');
});

var WebSocketServer = require('websocket').server;
wsServer = new WebSocketServer({
  httpServer: server
});

var count = 0;
var clients = {};

function getPlayers() {
  var players = [];
  for (var i in clients) {
    if (clients.hasOwnProperty(i)) {
      players.push(clients[i].player)
    }
  }
  return players;
}

function broadcastPlayers() {
  var players = getPlayers();
  var playersJson = JSON.stringify(players);
  for (var i in clients) {
    if (clients.hasOwnProperty(i)) {
      clients[i].sendUTF(playersJson);
    }
  }
}

wsServer.on('request', function(r) {
  // Code here to run on connection

  var connection = r.accept('echo-protocol', r.origin);

  // Specific id for this client & increment count
  var id = count++;
  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection;

  connection.player = {
    name: null
  };

  console.log((new Date()) + ' Connection accepted [' + id + ']');

  // Create event listener
  connection.on('message', function(message) {

    // The string message that was sent to us
    connection.player.name = message.utf8Data;
    broadcastPlayers();

  });

  connection.on('close', function(reasonCode, description) {
    delete clients[id];
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });

});
