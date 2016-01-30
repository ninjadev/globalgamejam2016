'use strict';

var utility = require('./../game/utility.js');
var http = require('http');
var types = require('./../game/types.js');
var Character = require('./../game/Character');
var Bullet = require('./../game/Bullet');
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
var fireCooldownTime = 11;

wsServer.on('request', function(r) {
  // Code here to run on connection

  var connection = r.accept('echo-protocol', r.origin);

  // Specific id for this client & increment count
  var id = count++;
  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection;
  connection.player = {
    character: new Character(),
    name: '',
    input: []
  };

  console.log((new Date()) + ' Connection accepted [' + id + ']');

  connection.on('message', function(message) {

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
  return +new Date();
}

function log() {
  var message = Array.prototype.join.call(arguments, '')
  console.log.apply(
    console, ['[' + (getTime() - initialTime | 0) + ']'].concat(message));
}

function update() {
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    var character = player.character;
    character.update(player.input);

    if(character.fireCooldown > 0){
      character.fireCooldown--;
    }


    if(player.input[BUTTONS.FIRE] && character.fireCooldown <= 0){
      character.fireCooldown = fireCooldownTime;
      var m_x = player.input[BUTTONS.MOUSE_X];
      var m_y = player.input[BUTTONS.MOUSE_Y];
      
      var fire_dir_x = m_x - character.x;
      var fire_dir_y = m_y - character.y;
      var fire_dir_len = Math.sqrt(fire_dir_x * fire_dir_x + fire_dir_y * fire_dir_y);
      
      //if you click yourself don't shoot
      if(fire_dir_len > 0.01) {
        //Scale to unit length
        fire_dir_x = fire_dir_x / fire_dir_len;
        fire_dir_y = fire_dir_y / fire_dir_len;
        
        bullets.push((new Bullet()).fire(character, fire_dir_x, fire_dir_y));
      }
    } 
  }
  for(var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    bullet.update(clients);
    if(!bullet.active){
      bullets[i] = bullets[bullets.length - 1];
      bullets.length = bullets.length - 1;
    }
  }
}

function sendNetworkState() {
  var state = [];
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    var characterState = player.character.getState();
    characterState.id = i;
    characterState.type = types.PLAYER;
    state.push(characterState);
  }
  for(var i = 0; i < bullets.length; i++){
    var bulletState = bullets[i].getState();
    bulletState.type= types.BULLET;
    state.push(bulletState);
  }
  var stateAsJSON = JSON.stringify(state);
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    clients[i].sendUTF(stateAsJSON);
  }
}
