function GameState() { }

var types = {
  PLAYER: 1,
  BULLET: 2
}



GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://localhost:1337', 'echo-protocol');
  //var ws = new WebSocket('ws://192.168.177.22:1337', 'echo-protocol');
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
        var team = message.team == 0 ? 'light' : 'dark';
        console.log('el teamo', team);
        document.querySelector('body').classList.remove('dark');
        document.querySelector('body').classList.add('light');
        document.querySelector('body').classList.add(team);
      }
    }
  });
};


GameState.prototype.init = function() {
  this.bg = loadImage('res/ggj-bg.jpg');
  this.bgDark = loadImage('res/ggj-bg-dark.jpg');
  this.bgLight = loadImage('res/ggj-bg-light.jpg');
  this.playerImgLight = loadImage('res/player-light.png');
  this.playerImgDark = loadImage('res/player.png');
  this.cpNeutralImg = loadImage('res/marker.png');
  this.connectWebsocket();
  this.scoreL = 8;
  this.scoreD = 0;
  this.cameraZoom = 0.5;
  this.cameraX = 0;
  this.cameraY = 0;
  this.states = [];
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
  this.scoreL = 10 + 10 * Math.sin(+new Date() / 10000);
  this.scoreD = 10;

  var states = this.states; 
  if(states[0]) {
    if(tick < states[0].tick){
      tick = states[0].tick; //global variables <3  ...
      console.log("Local tick too long behind");
    }
    if(tick >= states[2].tick){
      tick = states[2].tick - 1; //Don't go past last tick, remember we are adding subticks too
      console.log("Local tick too far ahead");
    }

    var state = tick >= states[1].tick ? states[1] : states[0];
    var state_next = tick >= states[1].tick ? states[2] : states[1];

    var coeff = (tick + dt/15 - state.tick) / (state_next.tick - state.tick);

    var players      = state.players;
    var players_next = state_next.players;

    var you = players[this.youId];
    var you_next = players_next[this.youId];
    if(you_next && you){
      var you_x = you.x * (1 - coeff) + you_next.x * coeff;
      var you_y = you.y * (1 - coeff) + you_next.y * coeff;
      this.cameraX = you_x;
      this.cameraY = you_y;
    }else if(you){
      this.cameraX = you.x;
      this.cameraY = you.y;
    }else{
      this.cameraX = 5;
      this.cameraY = 5;
    }

    ctx.save();
    ctx.translate(8 * GU - this.cameraX * GU * this.cameraZoom,
        4.5 * GU - this.cameraY * GU * this.cameraZoom);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.save();
    ctx.scale(16 * GU / 1920 * 4, 16 * GU / 1920 * 4);
    ctx.drawImage(this.bg, 0, 0);
    ctx.globalAlpha = clamp(0, this.scoreL - this.scoreD - 10, 20) / 40;
    ctx.drawImage(this.bgDark, 0, 0);
    ctx.globalAlpha = clamp(0, this.scoreD - this.scoreL - 10, 20) / 40;
    ctx.drawImage(this.bgLight, 0, 0);
    ctx.restore();

    var capture_points      = state.capture_points;
    var capture_points_next = state_next.capture_points;
    for(var i in capture_points) {
      CapturePoint.prototype.render.call(
          capture_points[i], 
          ctx,
          capture_points_next[i],
          this.cpNeutralImg);
    }

    for(var i in players) {
      var player = players[i];
      var player_next = players_next[i];
      var name = this.players[i].name;
      Character.prototype.render.call(
          player,
          ctx,
          player_next,
          coeff,
          this.playerImgLight,
          this.playerImgDark,
          name);
    }


    var bullets      = state.bullets;
    var bullets_next = state_next.bullets;
    for(var i in bullets) {
      var bullet = bullets[i];
      var bullet_next = bullets_next[i];
      Bullet.prototype.render.call(bullet, ctx, bullet_next, coeff);
    }

    ctx.restore();
  }

  this.audioButton.render();
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
      KEYS[87] || KEYS[38], // W, up arrow
      KEYS[83] || KEYS[40], // S, down arrow
      KEYS[65] || KEYS[37], // A, left arrow
      KEYS[68] || KEYS[39],  // D, right arrow
      MOUSE.left || KEYS[13], // enter
      MOUSE.right,
      MOUSE.x - 8 + this.cameraX,
      MOUSE.y - 4.5 + this.cameraY
      ]
    }));
  }
};
