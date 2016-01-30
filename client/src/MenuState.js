function MenuState() {
};

MenuState.prototype.init = function() {
  this.bg_img = loadImage('res/bg.png');
  this.vignette_img = loadImage('res/vignette.png');
  this.menu_img = loadImage('res/menu@2x.png');

  this.key_cooldown = 0;

  var that = this;
  this.elements = [
    [function() {
      sm.changeState('game');
    }, {x: 0.5, y: 1.8, w: 16, h: 1.5, hover: function() {
      that.select(0);
    }}],
    [function() {
      sm.changeState('game');
    }, {x: 0.5, y: 3.3, w: 16, h: 1.5, hover: function() {
      that.select(1);
    }}],
    [function() {
      sm.changeState('game');
    }, {x: 0.5, y: 4.8, w: 16, h: 1.5, hover: function() {
      that.select(2);
    }}]
  ];

  this.y_values = [1.8, 3.3, 4.8];
  this.y_time = 1;
  this.y = this.y_values[0];
  this.start_y = this.y_values[0];
  this.end_y = this.y_values[0];
  this.selected = 0;
};

MenuState.prototype.setY = function(y) {
  this.start_y = this.y;
  this.end_y = y;
  this.y_time = 0;
};

MenuState.prototype.select = function(selected) {
  if (this.selected == selected) {
    return;
  }
  this.selected = selected;
  this.setY(this.y_values[this.selected]);
};

MenuState.prototype.pause = function() {
  document.removeEventListener('keypress', this.fullscreenHandler);
  $("#wrapper > .logo").remove();
  $('.player-name-container').hide();
};

MenuState.prototype.resume = function() {
  var that = this;
  this.fullscreenHandler = document.addEventListener('keypress', function(e) {
    if (e.keyCode == 13 && that.selected == 0) {
      document.body.requestFullscreen && document.body.requestFullscreen();
      document.body.webkitRequestFullscreen && document.body.webkitRequestFullscreen();
      document.body.mozRequestFullscreen && document.body.mozRequestFullScreen();
    }
  });
  var logo = $('.logo.template').clone().removeClass('template');
  $('#wrapper').append(logo);
  $('.player-name-container').show();
  $('#player-name-input').val(localStorage.playerName);
};

MenuState.prototype.render = function(ctx) {

  ctx.save();
  var scaler = 16 * GU / this.bg_img.width + 0.01 + 0.01 * Math.sin(t / 125);
  ctx.translate(CENTER.x * GU, CENTER.y * GU);
  ctx.scale(scaler, scaler);
  ctx.translate(-this.bg_img.width / 2, -this.bg_img.height / 2);
  ctx.drawImage(this.bg_img, 0, 0);
  ctx.restore();

  ctx.save();
  scaler = 16 * GU / this.vignette_img.width;
  ctx.scale(scaler, scaler);
  ctx.drawImage(this.vignette_img, 0, 0);
  ctx.restore();


  ctx.fillStyle = '#8742d1';
  ctx.fillRect(3.9 * GU, this.y * GU, 8.2 * GU, GU);

  ctx.save();
  ctx.translate(0, 1.32 * GU);
  scaler = 16 * GU / this.menu_img.width;
  ctx.scale(scaler, scaler);
  ctx.drawImage(this.menu_img, 0, 0);
  ctx.restore();
};

MenuState.prototype.update = function() {
  this.key_cooldown && this.key_cooldown--;
  this.y_time += 0.12;
  if (this.y_time < 1) {
    this.y = smoothstep(this.start_y, this.end_y, this.y_time);
  } else if (this.y_time > 1) {
    this.y_time = 1;
    this.y = this.end_y;
  }


  if (!this.key_cooldown) {
    if (KEYS[40]) { /* key down */
      this.selected + 1 < this.y_values.length && this.select(this.selected + 1);
      this.key_cooldown = 10;
    }
    if (KEYS[38]) { /* key up */
      this.selected - 1 >= 0 && this.select(this.selected - 1);
      this.key_cooldown = 10;
    }
    if (KEYS[13]) { /* key enter */
      this.key_cooldown = 10;
      sm.changeState(['game', 'achievements', 'credits'][this.selected]);
    }
  }
};
