'use strict';

var utility = require('./../game/utility.js');
var http = require('http');
var types = require('./../game/types.js');
var sounds = require('./../game/sounds.js');
var Character = require('./../game/Character');
var Bullet = require('./../game/Bullet');
var Wall = require('./../game/Wall');
var CapturePoint = require('./../game/CapturePoint');
var server = http.createServer(function(request, response) {});


server.listen(1337, function() {
  console.log((new Date()) + ' Server is listening on port 1337');
});

var WebSocketServer = require('websocket').server;
var wsServer = new WebSocketServer({
  httpServer: server
});

var LIGHT = 0;
var DARK = 1;

var count = 0;
var clients = {};
var bullets = [];
var walls = [];
utility.populate_walls(walls, Wall);
var capture_points = [];
var dark_points = 0;
var light_points = 0;
var soundsToPlay = {};

reset_game();


var fireCooldownTime = 11;

var teamCount = [0, 0];

wsServer.on('request', function(r) {
  // Code here to run on connection

  var connection = r.accept('echo-protocol', r.origin);

  // Specific id for this client & increment count
  var id = count++;
  // Store the connection method so we can loop through & contact all clients
  clients[id] = connection;
  console.log((new Date()) + ' Connection accepted [' + id + ']');

  connection.on('message', function(message) {

    var event = JSON.parse(message.utf8Data);
    if(event.type == 'inputs') {
      if(!connection.player) return;
      connection.player.input = [false].concat(event.inputs);
    } else if (event.type == 'join') {
      var team = null;
      if (teamCount[LIGHT] > teamCount[DARK]) {
        team = DARK;
      } else if(teamCount[DARK] > teamCount[LIGHT]) {
        team = LIGHT;
      } else {
        team = Math.random() * 2 | 0;
      }
      teamCount[team]++;

      var spawnPoint = Character.getRandomSpawnPoint(team, capture_points);

      connection.player = {
        character: new Character(team, spawnPoint),
        name: event.name,
        input: []
      };
      for(var i in clients) {
        if(!clients.hasOwnProperty(i)) {
          continue;
        }
        clients[i].send(JSON.stringify({
          type: 'join',
          name: connection.player.name,
          id: id,
          team: connection.player.character.team,
          you: i == id
        }));

        if(i != id) {
          connection.send(JSON.stringify({
              type: 'join',
              name: clients[i].player.name,
              team: clients[i].player.character.team,
              id: i,
              you: false
          }));
        }
      }
    }
  });

  connection.on('close', function(reasonCode, description) {
    var client = clients[id];
    if(client.player){
      teamCount[client.player.character.team]--;
    }
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
    tick++;
  }
  if(networkTickAccumulator > NETWORK_TICK_LENGTH_IN_MS) {
    networkTickAccumulator = networkTickAccumulator % NETWORK_TICK_LENGTH_IN_MS;
    sendNetworkState(tick);
  }
  setTimeout(loop);
}

loop();

var tick = 0;
var initialTime = getTime();
var time = getTime();
var oldTime = time;
var deltaTime = 0;
var updateTickAccumulator = 0;
var networkTickAccumulator = 0;
var UPDATE_TICK_LENGTH_IN_MS = 15;
var NETWORK_TICK_LENGTH_IN_MS = 50;

function getTime() {
  return +new Date();
}

function log() {
  var message = Array.prototype.join.call(arguments, '');
  console.log.apply(
    console, ['[' + (getTime() - initialTime | 0) + ']'].concat(message));
}

function update() {
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    if (!player) {
      continue;
    }
    var character = player.character;
    character.update(player.input, walls, utility, capture_points);

    if(character.fireCooldown > 0){
      character.fireCooldown--;
    }

    if (player.input[BUTTONS.FIRE] && character.fireCooldown <= 0 && !character.overheated && !character.timeDied) {
      character.fireCooldown = fireCooldownTime;
      var m_x = player.input[BUTTONS.MOUSE_X];
      var m_y = player.input[BUTTONS.MOUSE_Y];
      
      var fire_dir_x = m_x - character.x;
      var fire_dir_y = m_y - character.y;
      var fire_dir_len = Math.sqrt(fire_dir_x * fire_dir_x + fire_dir_y * fire_dir_y);
      
      //if you click yourself don't shoot
      if (fire_dir_len > 0.01) {
        //Scale to unit length
        fire_dir_x = fire_dir_x / fire_dir_len;
        fire_dir_y = fire_dir_y / fire_dir_len;

        var blocked_by_wall = false;
        for (var i = 0; i < walls.length; i++) {
          if (utility.lineIntersect(character.x,
                                   character.y,
                                   character.x + (character.bodyRadius + 0.2) * fire_dir_x,
                                   character.y + (character.bodyRadius + 0.2) * fire_dir_y,
                                   walls[i].start_x,
                                   walls[i].start_y,
                                   walls[i].end_x,
                                   walls[i].end_y)) {
            blocked_by_wall = true;
          }
        }
        if (!blocked_by_wall) {
          // fire
          bullets.push((new Bullet()).fire(character, fire_dir_x, fire_dir_y));
        }
        character.weaponHeat += 0.2;
        if (character.weaponHeat > Character.OVERHEAT_THRESHOLD) {
          character.overheated = true;
          character.weaponHeat = Character.OVERHEAT_THRESHOLD;
        }
        soundsToPlay['bullet_fired.mp3'] = true;
      }
    }
  }
  for(var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    bullet.update(clients, walls);
    if(!bullet.active){
      bullets[i] = bullets[bullets.length - 1];
      bullets.length = bullets.length - 1;
    }
  }

  var lightOwnsAllCapturePoints = true;
  var darkOwnsAllCapturePoints = true;
  for(var i = 0; i < capture_points.length; i++){
    capture_points[i].update(clients);
    if(capture_points[i].ownage_d == 1) {
      dark_points += 1;
      lightOwnsAllCapturePoints = false;
    } else if(capture_points[i].ownage_d == -1) {
      light_points += 1;
      darkOwnsAllCapturePoints = false;
    } else {
      lightOwnsAllCapturePoints = false;
      darkOwnsAllCapturePoints = false;
    }
  }
  if (lightOwnsAllCapturePoints) {
    light_points += 30;
  } else if (darkOwnsAllCapturePoints) {
    dark_points += 30;
  }
  if(dark_points >= 30000 || light_points >= 30000) {
    reset_game();
  }
}

function sendNetworkState(tick) {
  var state = {};
  state.tick = tick;
  state.players = {};
  state.bullets = {};
  state.capture_points = {};
  state.dark_points = dark_points;
  state.light_points = light_points;
  state.sounds = [];

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    if(!player) {
      continue;
    }
    var characterState = player.character.getState();
    state.players[i] = characterState;
  }
  for(var i = 0; i < bullets.length; i++){
    var bulletState = bullets[i].getState();
    var id = bullets[i].id;
    state.bullets[id] = bulletState;
  }

  for(var i = 0; i < capture_points.length; i++){
    var cpState = capture_points[i].getState();
    var id = capture_points[i].id;
    state.capture_points[id] = cpState;
  }

  for (var sound in soundsToPlay) {
    if(soundsToPlay.hasOwnProperty(sound)) {
      var soundId = sounds.byName[sound];
      state.sounds.push(soundId)
    }
  }

  var messageAsJSON = JSON.stringify({
    type: 'state',
    state: state
  });

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    clients[i].sendUTF(messageAsJSON);
  }
  soundsToPlay = {};
}

function shuffle(o){
  // http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript
  for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
  return o;
}

function reset_game() {

  capture_points = [];
  bullets = [];
  dark_points = 0;
  light_points = 0;

  capture_points.push(new CapturePoint(14, 41));
  capture_points.push(new CapturePoint(33.8, 45.2));
  capture_points.push(new CapturePoint(33, 25));
  capture_points.push(new CapturePoint(32, 38));
  capture_points.push(new CapturePoint(51, 37.8));

  var randomizedCapturePointIds = shuffle([0, 1, 2, 3, 4]);
  capture_points[randomizedCapturePointIds[0]].team = DARK;
  capture_points[randomizedCapturePointIds[0]].ownage_d = 1;

  capture_points[randomizedCapturePointIds[1]].team = LIGHT;
  capture_points[randomizedCapturePointIds[1]].ownage_d = -1;

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    clients[i].player.hp = 10;
    clients[i].player.weaponHeat = 0;
    clients[i].player.overheated = false;
  }
}
