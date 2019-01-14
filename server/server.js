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
console.log(utility.populate_walls);
utility.populate_walls(walls, Wall);
var capture_points = [];
var dark_points = 0;
var light_points = 0;
var soundsToPlay = {};
var announce_timer = 0;
/* used for triggering sound effects */
var oldLightCapturePointCount = 0;
var oldDarkCapturePointCount = 0;
var commands = {
  "!bspeed" : function(value){
      Bullet.speed = value;
  },
  "!bdmg" : function(value){
      Bullet.damage = value;
  },
  "!firecd" : function(value){
      fireCooldownTime = value*60;
  },
  "!heatrate" : function(value){
      Character.heat_per_shot = value;
  },
  "!friction" : function(value){
      Character.breaking_coefficient = value;
  },
}

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
      connection.input_tick = event.tick;

    } else if (event.type == 'chat') {
      console.log((new Date()) + ' Chat: ' + connection.player.name + ': ' + event.message);
      parseChatMessage(event.message);
      for(var i in clients) {
        if(!clients.hasOwnProperty(i)) {
          continue;
        }
        clients[i].send(JSON.stringify({
          type: 'chat',
          message: event.message,
        }));
      }
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

      var spawnPoint = Character.getDefaultPoint(team);

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


function parseChatMessage(msg){
  var msg_split = msg.split(" ");
  var prefix = msg_split[0];
  if(prefix in commands){
    var value = parseFloat(msg_split[1]);
    if(!isNaN(value)){
      commands[prefix](msg_split[1]);
    }
  }
}

function loop() {
  time = getTime();
  var deltaTime = time - oldTime;
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
var UPDATE_TICK_LENGTH_IN_MS = 1000 / 60;
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
// Determine if the game is over and freeze everything for five seconds before resetting everything.
  if(dark_points >= 30000 || light_points >= 30000) {
    if(announce_timer == 0) {
      announce_timer = time + 5000;
      if(dark_points > light_points) {
        soundsToPlay['game-over-dark-wins.mp3'] = true;
      } else {
        soundsToPlay['game-over-light-wins.mp3'] = true;
      }
    } else if(announce_timer<time) {
      reset_game();
    }
    return ;
  }

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    if (!player) {
      continue;
    }
    var character = player.character;
    character.update(player.input, walls, utility, capture_points, character.team == 0 ? light_points: dark_points);

    if(character.fireCooldown > 0){
      character.fireCooldown--;
    }


    if (player.input[BUTTONS.FIRE]
        && character.fireCooldown <= 0
        && !character.timeDied) {

      character.fireCooldown = fireCooldownTime;

      if (player.input[BUTTONS.FIRE] && (character.onCP || character.isShieldActive || character.overheated)) {
        soundsToPlay['click.mp3'] = true;
      } else {
        var m_dir = player.input[BUTTONS.MOUSE_DIR];

        var fire_dir_x = Math.cos(m_dir);
        var fire_dir_y = Math.sin(m_dir);

        var blocked_by_wall = false;
        for (var i = 0; i < walls.length; i++) {
          if (utility.lineIntersect(character.x,
                character.y,
                character.x + (Character.BODY_RADIUS + 0.2) * fire_dir_x,
                character.y + (Character.BODY_RADIUS + 0.2) * fire_dir_y,
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
        character.weaponHeat += Character.heat_per_shot;
        if (character.weaponHeat > Character.OVERHEAT_THRESHOLD) {
          character.overheated = true;
          character.weaponHeat = Character.OVERHEAT_THRESHOLD;
        }
        soundsToPlay[
          ['gun-1.mp3', 'gun-2.mp3', 'gun-3.mp3'][Math.random()*3|0]] = true;
      }
    }
  }
  for(var i = 0; i < bullets.length; i++){
    var bullet = bullets[i];
    bullet.update(clients, walls, soundsToPlay);
    if(!bullet.active){
      bullets[i] = bullets[bullets.length - 1];
      bullets.length = bullets.length - 1;
    }
  }

  //Set onCP = false for all players
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    if (!player) {
      continue;
    }
    var character = player.character;
    character.onCP = false;
  }

  var lightOwnsAllCapturePoints = true;
  var darkOwnsAllCapturePoints = true;
  var lightCapturePointCount = 0;
  var darkCapturePointCount = 0;
  for(var i = 0; i < capture_points.length; i++){
    capture_points[i].update(clients);
    if(capture_points[i].ownage_d == 1) {
      dark_points += 1;
      lightOwnsAllCapturePoints = false;
      darkCapturePointCount++;
    } else if(capture_points[i].ownage_d == -1) {
      light_points += 1;
      darkOwnsAllCapturePoints = false;
      lightCapturePointCount++;
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
  if(lightCapturePointCount > oldLightCapturePointCount) {
    soundsToPlay['light-ritual-complete.mp3'] = true;
  }
  if(darkCapturePointCount > oldDarkCapturePointCount) {
    soundsToPlay['dark-ritual-complete.mp3'] = true;
  }
  oldLightCapturePointCount = lightCapturePointCount;
  oldDarkCapturePointCount = darkCapturePointCount;
}

function getState(tick) {
  var state = {};
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
  return state;
}

function sendNetworkState(tick) {
  var state = getState(tick);
  state.tick = tick;

  var messageAsJSON = JSON.stringify({
    type: 'state',
    state: state
  });

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var messageAsJSON = JSON.stringify({
      type: 'state',
      state: state,
      input_tick: clients[i].input_tick ? clients[i].input_tick : 0
    });
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
  announce_timer = 0;
  oldLightCapturePointCount = 0;
  oldDarkCapturePointCount = 0;

  capture_points.push(new CapturePoint(14, 41));
  capture_points.push(new CapturePoint(33.8, 45.2));
  capture_points.push(new CapturePoint(33, 25));
  capture_points.push(new CapturePoint(32, 38));
  capture_points.push(new CapturePoint(51, 37.8));

  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var player = clients[i].player;
    if(player){
      var chara = player.character;
      chara.init(Character.getDefaultPoint(chara.team));
    }
  }
}
