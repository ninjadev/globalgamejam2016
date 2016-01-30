'use strict';

var http = require('http');
var types = require('./../game/types.js');
var Character = require('./../game/Character');
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

        bullets.push({
          x: character.x + 0.3*fire_dir_x,
          y: character.y + 0.3*fire_dir_y,
          dx: fire_dir_x * 0.3 + character.dx,
          dy: fire_dir_y * 0.3 + character.dy});
      }
    } 
  }
  for(var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    var newX = bullet.x + bullet.dx;
    var newY = bullet.y + bullet.dy;
    if(checkCollisionWithPlayers(bullet, bullet.x, bullet.y, newX, newY)){
      bullets[i] = bullets[bullets.length - 1];
      bullets.length = bullets.length - 1;
    }else{
      bullet.x = newX;
      bullet.y = newY;
    }

    if(bullet.x > 16 
      || bullet.y > 9
      || bullet.y < 0
      || bullet.y < 0){
      bullets[i] = bullets[bullets.length - 1];
      bullets.length = bullets.length - 1;
      
      
    }
    
  }
}

function checkCollisionWithPlayers(bullet, oldX, oldY, newX, newY){
  var hit = false;
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var character = clients[i].player.character;
    if(intersectLineCircle(oldX, oldY, newX, newY, character.x, character.y, character.bodyRadius)){
      character.x = 5;
      character.y = 5;
      hit = true;
    }
  }
  return hit;
}


function intersectLineCircle(startX, startY, endX, endY, centerX, centerY, radius){
    // http://stackoverflow.com/questions/1073336/circle-line-segment-collision-detection-algorithm
    var d_x = endX - startX;
    var d_y = endY - startY;
    
    var f_x = startX - centerX;
    var f_y = startY - centerY;


    var a =  d_x*d_x + d_y * d_y;
    var b = 2 * (f_x*d_x + f_y*d_y);
    var c = (f_x*f_x + f_y*f_y) - radius * radius;

    var discriminant = b*b - 4*a*c;

    if(discriminant < 0){
      //no intersection
      return false;
    }else{
      discriminant = Math.sqrt(discriminant);
      // either solution may be on or off the ray so need to test both
      // t1 is always the smaller value, because BOTH discriminant and
      // a are nonnegative.
      var t1 = (-b - discriminant)/(2*a);
      var t2 = (-b + discriminant)/(2*a);

      // 3x HIT cases:
      //          -o->             --|-->  |            |  --|->
      // Impale(t1 hit,t2 hit), Poke(t1 hit,t2>1), ExitWound(t1<0, t2 hit), 

      // 3x MISS cases:
      //       ->  o                     o ->              | -> |
      // FallShort (t1>1,t2>1), Past (t1<0,t2<0), CompletelyInside(t1<0, t2>1)

      if( t1 >= 0 && t1 <= 1 )
      {
        // t1 is the intersection, and it's closer than t2
        // (since t1 uses -b - discriminant)
        // Impale, Poke
        return true ;
      }

      // here t1 didn't intersect so we are either started
      // inside the sphere or completely past it
      if( t2 >= 0 && t2 <= 1 )
      {
        // ExitWound
        return true ;
      }

      // no intn: FallShort, Past, CompletelyInside
      return false ;
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
