function GameState() {
}

var types = {
  PLAYER: 1,
  BULLET: 2
}



GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://localhost:1337', 'echo-protocol');
  var that = this;
  this.ws = ws;
  this.wsReady = false;
  var that = this;
  this.players = {};
  console.log("connecting to websocket");
  ws.addEventListener('open', function(e) {
    that.wsReady = true;
    console.log("Connected");
    ws.send(JSON.stringify({
      type: 'join',
      name: new Player().name
    }));
  });
  ws.addEventListener('message', function(e) {
    message = JSON.parse(e.data);
    if(message.type == 'state') {
      oldstates = that.states;
      that.states = [that.states[1]
                    ,that.states[2]
                    ,message.state];
    } else if(message.type == 'join') {
      that.players[message.id] = new Player(message.name);
      if(message.you) {
        that.youId = message.id;
      }
    }
  });
};


GameState.prototype.init = function() {
  this.bg = loadImage('res/ggj-bg.jpg');
  this.bgDark = loadImage('res/ggj-bg-light.png');
  this.vignette = loadImage('res/vignette.png');
  this.playerImg = loadImage('res/player.png');
  this.connectWebsocket();
  this.capture_points = [];
  this.capture_points.push(new CapturePoint(8, 8));
  this.scoreL = 8;
  this.scoreD = 0;
  this.cameraZoom = 0.5;
  this.cameraX = 0;
  this.cameraY = 0;
  this.states = [];

  var team = 'dark';
  document.querySelector('body').classList.remove('dark');
  document.querySelector('body').classList.add('light');
  document.querySelector('body').classList.add(team);
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
  var that = this;
  this.elements = [
    [function() {
    }, {x: 7.5, y: 4, w: 1, h: 1}],
    [function() {
      that.audioButton.toggleActivated();
    }, {x: 15, y: 0, w: 1, h: 1}]
  ];
  this.audioButton = new AudioButton();
  var playerName = document.getElementById('player-name-input').value;
  this.player = new Player(playerName);
  localStorage.playerName = playerName;
};

GameState.prototype.render = function(ctx) {
  ctx.save();
  ctx.translate(8 * GU - this.cameraX * GU * this.cameraZoom,
      4.5 * GU - this.cameraY * GU * this.cameraZoom);
  ctx.scale(this.cameraZoom, this.cameraZoom);
  ctx.save();
  ctx.scale(16 * GU / 1920 * 2, 16 * GU / 1920 * 2);
  ctx.drawImage(this.bg, 0, 0);
  ctx.drawImage(this.bgDark, 0, 0);
  ctx.restore();

  this.scoreL = (new Date()).getSeconds() - 30 + (new Date()).getMilliseconds() / 1000;

  //important to copy this to a local variable, as this.states can change at any time
  var states = this.states; 
  if(states[0]) {
    if(tick < states[0].tick){
      tick = states[0].tick; //global variables <3  ...
      console.log("Local tick too long behind");
    }
    if(tick > states[2].tick){
      tick = states[2].tick;
      console.log("Local tick too far ahead");
    }

    var state = tick > states[1].tick ? states[1] : states[0];
    var state_next = tick > states[1].tick ? states[2] : states[1];

    var coeff = (tick - state.tick) / (state_next.tick - state.tick);
    //coeff += dt/15; //Add partial tick time to interpolation coefficient

    var players      = state.players;
    var players_next = state_next.players;
    for(var i = 0; i < players.length; i++) {
      var player = players[i];
      var player_next = players_next[i];


      var name = this.players[player.id].name;
      Character.prototype.render.call(player, ctx, player_next, coeff, this.playerImg, name);
      if(player.id == this.youId) {
        this.cameraX = player.x * (1 - coeff) + player_next.x * coeff;
        this.cameraY = player.y * (1 - coeff) + player_next.y * coeff;
      }
    }


    var bullets      = state.bullets;
    var bullets_next = state_next.bullets;
    for(var i = 0; i < bullets.length; i++) {
      var bullet = bullets[i];
      var bullet_next = bullets_next[i];
      Bullet.prototype.render.call(bullet, ctx, bullet_next, coeff);
    }
  }
  ctx.restore();

  this.audioButton.render();
  for(var i = 0; i < this.capture_points.length; i++) {
    this.capture_points[i].render(ctx);
  }
};

GameState.prototype.update = function() {
  var that = this;


  if(MOUSE.scrollY) {
    this.cameraZoom *= 1 / ((MOUSE.scrollY + 1000) / 1000);
    this.cameraZoom = clamp(0.1, this.cameraZoom, 3);
  }

  if(this.wsReady) {
    var inputs = [];
    this.ws.send(JSON.stringify({
      type: 'inputs',
      inputs: [
      KEYS[87], // W
      KEYS[83], // S
      KEYS[65], // A
      KEYS[68],  // D
      MOUSE.left,
      MOUSE.right,
      MOUSE.x - 8 + this.cameraX,
      MOUSE.y - 4.5 + this.cameraY
      ]
    }));
  }
  for(var i = 0; i < this.capture_points.length; i++) {
    this.capture_points[i].update();
  }
};

GameState.prototype.setScoreD = function(scoreD) {
  this.scoreD = scoreD;
}

GameState.prototype.getScoreD = function() {
  return this.scoreD;
}

GameState.prototype.setScoreL = function(scoreL) {
  this.scoreL = scoreL;
}

GameState.prototype.getScoreL = function() {
  return this.scoreL;
}
