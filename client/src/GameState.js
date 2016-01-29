function GameState() {
}

GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://localhost:1337', 'echo-protocol');
  var that = this;
  this.ws = ws;
  this.wsReady = false;
  var that = this;
  ws.addEventListener('open', function(e) {
    that.wsReady = true;
  });
  ws.addEventListener('message', function(e) {
    that.state = JSON.parse(e.data);
  });
};


GameState.prototype.init = function() {
  this.bg = loadImage('res/bg.png');
  this.vignette = loadImage('res/vignette.png');
  this.connectWebsocket();
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
};

GameState.prototype.render = function(ctx) {
  ctx.save();
  var scaler = 16 * GU / this.bg.width + 0.01 + 0.01 * Math.sin(t / 125);
  ctx.translate(CENTER.x * GU, CENTER.y * GU);
  ctx.scale(scaler, scaler);
  ctx.translate(-this.bg.width / 2, -this.bg.height / 2);
  ctx.drawImage(this.bg, 0, 0);
  ctx.restore();

  ctx.save();
  scaler = 16 * GU / this.vignette.width;
  ctx.scale(scaler, scaler);
  ctx.drawImage(this.vignette, 0, 0);
  ctx.restore();

  ctx.fillStyle = 'blue';
  ctx.fillStyle = 'red';
  if(this.state) {
    for(var i = 0; i < this.state.length; i++) {
      var player = this.state[i];
      ctx.fillRect(player.x * GU, player.y * GU, GU / 4, GU / 4);
    }
  }

  this.audioButton.render();
};

GameState.prototype.update = function() {
  var that = this;
  var buttons = {
    MOVE_UP: 1,
    MOVE_DOWN: 2,
    MOVE_LEFT: 3,
    MOVE_RIGHT: 4,
    FIRE: 5,
    ALTERNATE_FIRE: 6
  };

  if(this.wsReady) {
    var inputs = [];
    if (KEYS[87]) { // W
      inputs.push(buttons.MOVE_UP);
    }
    if (KEYS[83]) { // S
      inputs.push(buttons.MOVE_DOWN);
    }
    if (KEYS[65]) { // A
      inputs.push(buttons.MOVE_LEFT);
    }
    if (KEYS[68]) { // D
      inputs.push(buttons.MOVE_RIGHT);
    }
    this.ws.send(JSON.stringify({
      type: 'inputs',
      inputs: [
        KEYS[87], // W
        KEYS[83], // S
        KEYS[65], // A
        KEYS[68],  // D
        false,
        false
      ]
    }));
  }
};
