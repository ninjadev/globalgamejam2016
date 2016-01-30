function GameState() {
}

var types = {
  PLAYER: 1,
  BULLET: 2
}



GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://192.168.177.11:1337', 'echo-protocol');
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
      that.state = message.state;
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

  if(this.state) {
    for(var i = 0; i < this.state.length; i++) {
      switch(this.state[i].type){
        case types.PLAYER:
          var player = this.state[i];
          if(!player) {
            continue;
          }
          var name = this.players[player.id].name;
          Character.prototype.render.call(player, ctx, this.playerImg, name);
          break;
        case types.BULLET:
          var bullet = this.state[i];
          ctx.fillStyle = '#B0B0E0';
          Bullet.prototype.render.call(bullet, ctx);
          break;

      }
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

  if(this.state) {
    for(var i = 0; i < this.state.length; i++) {
      if(this.state[i].type == types.PLAYER && this.state[i].id == this.youId) {
        this.cameraX = this.state[i].x;
        this.cameraY = this.state[i].y;
      }
    }
  }

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
