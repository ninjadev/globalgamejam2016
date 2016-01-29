function GameState() {
};

GameState.prototype.init = function() {
  this.bg = loadImage('res/bg.png');
  this.vignette = loadImage('res/vignette.png');
};

GameState.prototype.pause = function() {
};

GameState.prototype.resume = function() {
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
};

GameState.prototype.update = function() {
  var that = this;
};
