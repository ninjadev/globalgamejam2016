function GameState() {
}

var types = {
  PLAYER: 1,
  BULLET: 2
}



GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://192.168.177.22:1337', 'echo-protocol');
  var that = this;
  this.ws = ws;
  this.wsReady = false;
  var that = this;
  console.log("connecting to websocket");
  ws.addEventListener('open', function(e) {
    that.wsReady = true;
    console.log("Connected");
  });
  ws.addEventListener('message', function(e) {
    that.state = JSON.parse(e.data);
    //console.log(that.state[0]);
  });
};


GameState.prototype.init = function() {
  this.bg = loadImage('res/bg.jpg');
  this.vignette = loadImage('res/vignette.png');
  this.connectWebsocket();
  this.capture_points = [];
  this.capture_points.push(new CapturePoint(8, 8));
  this.scoreL = 8;
  this.scoreD = 0;
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
  var scaler = 30 * GU / this.bg.width + 0.02 + 0.02 * Math.sin(t / 200);
  ctx.translate((clamp(-7, (this.scoreL - this.scoreD)/4, 7) + CENTER.x) * GU, CENTER.y * GU);
  ctx.scale(scaler, scaler);
  ctx.translate(-this.bg.width / 2, -this.bg.height / 2);
  ctx.drawImage(this.bg, 0, 0);
  ctx.restore();

  this.scoreL = (new Date()).getSeconds() - 30 + (new Date()).getMilliseconds() / 1000;

  ctx.save();
  scaler = 16 * GU / this.vignette.width;
  ctx.scale(scaler, scaler);
  ctx.drawImage(this.vignette, 0, 0);
  ctx.restore();

  if(this.state) {
    for(var i = 0; i < this.state.length; i++) {
      switch(this.state[i].type){
        case types.PLAYER:
          var player = this.state[i];
          Character.prototype.render.call(player, ctx);
          break;
        case types.BULLET:
          var bullet = this.state[i];
          ctx.fillStyle = '#B0B0E0';
          ctx.fillRect(bullet.x * GU, bullet.y * GU, GU / 8, GU / 8);
          break;

      }
    }
  }

  this.audioButton.render();
  for(var i = 0; i < this.capture_points.length; i++) {
    this.capture_points[i].render(ctx);
  }
};

GameState.prototype.update = function() {
  var that = this;

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
        MOUSE.x,
        MOUSE.y
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
