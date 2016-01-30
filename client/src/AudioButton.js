function AudioButton() {
  var that = this;
  this.position = {
    x: 15.5,
    y: 0.5
  };

  if (typeof localStorage.soundActivated === 'undefined') {
    localStorage.soundActivated = "1";
  }

  this.on = !!localStorage.soundActivated;
  setTimeout(function() {
    createjs.Sound.setMute(!that.on);
    console.log('should mute', !that.on);
  }, 10);

  this.musicElement = $("#music")[0];
  if (this.on) {
    this.musicElement.play && this.musicElement.play();
  }
}

AudioButton.prototype.render = function() {
  var sprite = this.on ? this.sprite_on : this.sprite_off;
  ctx.save();
  var scaler = sprite.width * GU * 0.00025;
  ctx.translate(this.position.x * GU, this.position.y * GU);
  ctx.scale(scaler, scaler);
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  ctx.restore();
};

AudioButton.prototype.pause = function() {
  this.musicElement.pause && this.musicElement.pause();
  localStorage.soundActivated = "";
};

AudioButton.prototype.toggleActivated = function() {
  this.on = !this.on;
  createjs.Sound.setMute(!this.on);
  if (this.on) {
    this.musicElement.play && this.musicElement.play();
  } else {
    this.musicElement.pause && this.musicElement.pause();
  }

  localStorage.soundActivated = this.on ? "1" : "";
};
