'use strict';
  // The data is simply the message that we're sending back

var http = require('http');
var buttons = require('./input.js');
var server = http.createServer(function(request, response) {});


server.listen(1337, function() {
  console.log((new Date()) + ' Server is listening on port 1337');
});

var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
  httpServer: server
});

var count = 0;
var clients = {};

wsServer.on('request', function(r) {
  // Code here to run on connection

  var connection = r.accept('echo-protocol', r.origin);

  // Specific id for this client & increment count
  var id = count++;
  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection;

  connection.player = generatePlayer();

  console.log((new Date()) + ' Connection accepted [' + id + ']');

  // Create event listener
  connection.on('message', function(message) {

    // The string message that was sent to us
    connection.player.name = message.utf8Data;
  });

  connection.on('close', function(reasonCode, description) {
    delete clients[id];
    console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
  });

});



function loop() {
  time = getTime();
  var deltaTime = time -oldTime;
  updateTickAccumulator += deltaTime;
  networkTickAccumulator += deltaTime;
  oldTime = time;
  while(updateTickAccumulator > UPDATE_TICK_LENGTH_IN_MS) {
    updateTickAccumulator -= UPDATE_TICK_LENGTH_IN_MS;  
    processInput();
    update();
  }
  if(networkTickAccumulator > NETWORK_TICK_LENGTH_IN_MS) {
    networkTickAccumulator = networkTickAccumulator % NETWORK_TICK_LENGTH_IN_MS;
    sendNetworkState();
  }
  setTimeout(loop);
}

loop();

var initialTime = getTime();
var time = getTime();
var oldTime = time;
var deltaTime = 0;
var updateTickAccumulator = 0;
var networkTickAccumulator = 0;
var UPDATE_TICK_LENGTH_IN_MS = 15;
var NETWORK_TICK_LENGTH_IN_MS = 50;
var FRICTION_COEFFICIENT = 0.9;

function getTime() {
  return +new Date() / 1;
}

function log() {
  var message = Array.prototype.join.call(arguments, '')
  console.log('[' + (getTime() - initialTime | 0) + ']', message);
}

function generatePlayer() {
  return {
    name: null,
    x: Math.random() * 16,
    y: Math.random() * 9,
    dx: 0,
    dy: 0,
    input: []
  };
}

function processInput() {
  log('processInput');
}

function update() {
  log('update');
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    var motionButtonPressed = false;
    if(player.input[buttons.MOVE_UP]) {
      player.dy = -1;
      motionButtonPressed = true;
    }
    if(player.input[buttons.MOVE_DOWN]) {
      player.dy = 1;
      motionButtonPressed = true;
    }
    if(player.input[buttons.MOVE_LEFT]) {
      player.dx = -1;
      motionButtonPressed = true;
    }
    if(player.input[buttons.MOVE_RIGHT]) {
      player.dx = 1;
      motionButtonPressed = true;
    }
    var normalizer = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
    if(normalizer) {
      player.dx *= 1 / normalizer;
      player.dy *= 1 / normalizer;
    }
    if(!motionButtonPressed) {
      player.dx *= FRICTION_COEFFICIENT;
      player.dy *= FRICTION_COEFFICIENT;
    }
    player.x += player.dx;
    player.y += player.dy;
  }
}

function sendNetworkState() {
  log('network state');
  var state = [];
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    state.push({
      id: i,
      x: player.x,
      y: player.y
    });
  }
  var stateAsJSON = JSON.stringify(state);
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    clients[i].sendUTF(stateAsJSON);
  }
}
