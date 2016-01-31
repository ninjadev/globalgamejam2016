function GameState() { }

var types = {
  PLAYER: 1,
  BULLET: 2
};

var ready_for_render = false;

GameState.prototype.connectWebsocket = function() {
  var ws = new WebSocket('ws://localhost:1337', 'echo-protocol');
  var that = this;
  this.ws = ws;
  this.wsReady = false;
  this.players = {};
  console.log("connecting to websocket");
  ws.addEventListener('open', function(e) {
    that.wsReady = true;
    console.log("Connected");
    ws.send(JSON.stringify({
      type: 'join',
      name: that.player.name
    }));
  });
  ws.addEventListener('message', function(e) {
    message = JSON.parse(e.data);
    if(message.type == 'state') {
      oldstates = that.states;
      that.states = [that.states[1]
                    ,that.states[2]
                    ,message.state];
      that.playSounds(message.state.sounds);
    } else if (message.type == 'join') {
      that.players[message.id] = new Player(message.name);
      if(message.you) {
        that.youId = message.id;
        var team = message.team == 0 ? 'light' : 'dark';
        ready_for_render = true;
      }
    }
  });
};


GameState.prototype.init = function() {
  this.bg = loadImage('res/ggj-bg.jpg');
  this.bgDark = loadImage('res/ggj-bg-dark.jpg');
  this.bgLight = loadImage('res/ggj-bg-light.jpg');
  this.playerImgLight = loadImage('res/player-light.png');
  this.playerImgDark = loadImage('res/player-dark.png');
  this.pointsOverlay = loadImage('res/points-overlay.png');
  this.ps = new ParticleSystem();

  var soundPath = 'res/sounds/';
  for (var soundName in SOUNDS.byName) {
    if (SOUNDS.byName.hasOwnProperty(soundName)) {
      createjs.Sound.registerSound(soundPath + soundName, soundName);
    }
  }
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
  var that = this;
  this.elements = [
    [function() {
    }, {x: 7.5, y: 4, w: 1, h: 1}],
    [function() {
      mm.audioButton.toggleActivated();
    }, {x: 15, y: 0, w: 1, h: 1}]
  ];
  var playerName = document.getElementById('player-name-input').value;
  this.player = new Player(playerName);
  localStorage.playerName = playerName;
  this.connectWebsocket();
  this.scoreL = 8;
  this.scoreD = 0;
  this.cameraZoom = 0.5;
  this.cameraX = 0;
  this.cameraY = 0;
  this.states = [];
};

GameState.prototype.render = function(ctx) {

  var states = this.states; 
  if(states[0] && ready_for_render) {
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

    } else if(you){
      this.cameraX = you.x;
      this.cameraY = you.y;

    } else {
      this.cameraX = 8;
      this.cameraY = 5;
    }

    var capture_points      = state.capture_points;
    var capture_points_next = state_next.capture_points;
    var total_ownage_d = 0;
    for(var i in capture_points) {
      total_ownage_d += capture_points[i].ownage_d;
    }

    ctx.save();
    ctx.translate(8 * GU - this.cameraX * GU * this.cameraZoom,
        4.5 * GU - this.cameraY * GU * this.cameraZoom);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.save();
    ctx.scale(16 * GU / 1920 * 4, 16 * GU / 1920 * 4);
    ctx.drawImage(this.bg, 0, 0);
    ctx.globalAlpha = Math.pow(Math.max(0, total_ownage_d / 5), 4);
    ctx.drawImage(this.bgDark, 0, 0);
    ctx.globalAlpha = Math.pow(Math.max(0, -total_ownage_d / 5), 4);
    ctx.drawImage(this.bgLight, 0, 0);
    ctx.restore();

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
      if(bullet && bullet_next == undefined) {
        var color = bullet.team == 0 ? 255 : 19;
        this.ps.explode(bullet.x, bullet.y, color, color, color);
      }
    }

    this.ps.render(ctx);

    ctx.restore();

    ctx.save();
    ctx.scale(16 * GU / 1920, 16 * GU / 1920);
    ctx.drawImage(this.pointsOverlay, 0, 0);
    ctx.restore();


    ctx.fillStyle = 'white';
    ctx.fillRect(104 / 1920 * 16 * GU, 19 / 1920 * 16 * GU,
        374 / 1920 * 16 * GU * state.light_points / 100 / 300,
     12 / 1920 * 16 * GU);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = (0.1 * GU) + 'px monospace';
    ctx.fillText('' + (state.light_points / 300 | 0),
        (104 + 10 + (state.light_points / 100 / 300) * 374) / 1920 * 16 * GU,
        18 / 1920 * 16 * GU);
    ctx.fillStyle = '#191919';
    ctx.fillRect(104 / 1920 * 16 * GU, 69 / 1920 * 16 * GU,
        374 / 1920 * 16 * GU * state.dark_points / 100 / 300,
     12 / 1920 * 16 * GU);

    ctx.fillStyle = 'white';
    ctx.fillText('' + (state.dark_points / 300 | 0),
        (104 + 10 + (state.dark_points / 100 / 300) * 374) / 1920 * 16 * GU,
        67 / 1920 * 16 * GU);

    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.translate(13.5 * GU, 6.5 * GU);
    ctx.scale(16 * GU / 1920 * 0.15, 16 * GU / 1920 * 0.15);
    ctx.drawImage(this.bg, 0, 0);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.05 * GU;
    ctx.strokeRect(0, 0, this.bg.width, this.bg.height);
    ctx.scale(0.325, 0.325);
    ctx.globalAlpha = 0.8;
    for(var i in capture_points) {
      CapturePoint.prototype.render.call(
          capture_points[i], 
          ctx,
          capture_points_next[i],
          this.cpNeutralImg);
    }
    ctx.restore();
    
    if(KEYS[9]){ //TAB
      TabOverlay.render(ctx, players, this.players);
    }

    // Announce the winner if the winning condition is met.
    if (state.dark_points > 30000) {
      TabOverlay.render(ctx, players, this.players);
      ctx.fillStyle = '#191919';
      ctx.fillRect(4 * GU, 7 * GU, 8 * GU, 1.6 * GU);
      ctx.fillStyle = 'white';
      ctx.fillText(
        'Dark team wins! Restarting game...',
        8 * GU, 8 * GU);
    }
    if (state.light_points > 30000) {
      TabOverlay.render(ctx, players, this.players);
      ctx.fillStyle = 'white';
      ctx.fillRect(3 * GU, 7 * GU, 10 * GU, 1.6 * GU);
      ctx.fillStyle = '#191919';
      ctx.fillText(
        'LIGHT TEAM WINS! Restarting game...',
        8 * GU, 8 * GU);
    }
    if (you) {
      Character.prototype.renderUi.call(you, ctx);
    }
  }

  mm.audioButton.render();
};

GameState.prototype.update = function() {
  var that = this;
  this.ps.update();


  if(MOUSE.scrollY) {
    this.cameraZoom *= 1 / ((MOUSE.scrollY + 1000) / 1000);
    this.cameraZoom = clamp(0.1, this.cameraZoom, 3);
  }

  var mouseDir = Math.atan2(
    MOUSE.y - 4.5,
    MOUSE.x - 8);

  if(this.wsReady) {
    var inputs = [];
    this.ws.send(JSON.stringify({
      type: 'inputs',
      inputs: [
      KEYS[87] || KEYS[38], // W, up arrow
      KEYS[83] || KEYS[40], // S, down arrow
      KEYS[65] || KEYS[37], // A, left arrow
      KEYS[68] || KEYS[39],  // D, right arrow
      MOUSE.left,
      MOUSE.right,
      mouseDir
      ]
    }));
  }
};

GameState.prototype.playSounds = function(soundIds) {
  for (var i = 0; i < soundIds.length; i++) {
    var soundName = SOUNDS.byId[soundIds[i]];
    createjs.Sound.play(soundName);
  }
};
