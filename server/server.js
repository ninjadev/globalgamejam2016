'use strict';
  // The data is simply the message that we're sending back

var http = require('http');
var buttons = require('./input.js');
var types = require('./types.js');
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
var bullets = [];

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
    var event = JSON.parse(message.utf8Data);
    if(event.type == 'inputs') {
      connection.player.input = [false].concat(event.inputs);
    }
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
var FRICTION_COEFFICIENT = 0.98;

function getTime() {
  return +new Date() / 1;
}

function log() {
  var message = Array.prototype.join.call(arguments, '')
  console.log.apply(
    console, ['[' + (getTime() - initialTime | 0) + ']'].concat(message));
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
  //log('processInput');
}

function update() {
  //log('update');
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
    if(normalizer > 1) {
      player.dx = player.dx / normalizer;
      player.dy = player.dy / normalizer;
    }
    player.dx *= 0.1;
    player.dy *= 0.1;
    player.dx *= FRICTION_COEFFICIENT;
    player.dy *= FRICTION_COEFFICIENT;
    player.x += player.dx;
    player.y += player.dy;


    if(player.input[buttons.FIRE]){
      var m_x = player.input[buttons.MOUSE_X]
      var m_y = player.input[buttons.MOUSE_Y]
      
      var fire_dir_x = m_x - player.x;
      var fire_dir_y = m_y - player.y;
      var fire_dir_len = Math.sqrt(fire_dir_x * fire_dir_x + fire_dir_y * fire_dir_y);
      
      //if you click yourself don't shoot
      if(fire_dir_len > 0.01) {
        //Scale to unit length
        fire_dir_x = fire_dir_x / fire_dir_len;
        fire_dir_y = fire_dir_y / fire_dir_len;
        
        //Scale to bullet speed
        fire_dir_x = fire_dir_x * 0.05;
        fire_dir_y = fire_dir_y * 0.05;

        bullets.push({x: player.x, y: player.y, dx: fire_dir_x + player.dx, dy: fire_dir_y + player.dy})
      }
    } 
  }
  for(var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    bullet.x += bullet.dx;
    bullet.y += bullet.dy;
  }
}

function sendNetworkState() {
  //log('network state');
  var state = [];
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    state.push({
      type: types.PLAYER,
      id: i,
      x: player.x,
      y: player.y
    });
  }
  for(var i = 0; i<bullets.length; i++){
    state.push({
      type: types.BULLET,
      x: bullets[i].x,
      y: bullets[i].y
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
