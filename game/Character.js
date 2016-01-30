try {
  window;
} catch(e) {
  var BUTTONS = require('./input');
}


function Character() {
  this.breakingCoefficient = 0.04;
  this.accelerationCoefficient = 0.01;
  this.bodyRadius = 0.4;
  this.MAX_HP = 10;
  this.init();
}

Character.prototype.init = function() {
  this.x = 0;
  this.y = 0;
  this.dx = 0;
  this.dy = 0;
  this.hp = this.MAX_HP;
  this.isShieldActive = false;
  this.fireCooldown = 0;
};

Character.prototype.getState = function() {
  return {
    t: 'C',
    x: this.x,
    y: this.y,
    hp: this.hp,
    mouseDirection: this.mouseDirection,
    isShieldActive: this.isShieldActive
  };
}

Character.prototype.hit = function(bullet) {
  this.dx += bullet.dx ;
  this.dy += bullet.dy ;
  this.hp --;
  if(this.hp <= 0){
    this.init();
  }
}

Character.prototype.update = function(input) {
  this.applyMovementForce(input);
  this.applyFrictionForce();
  var mouse_x = input[BUTTONS.MOUSE_X] || 0;
  var mouse_y = input[BUTTONS.MOUSE_Y] || 0;
  this.mouseDirection = Math.atan2(
    mouse_y - this.y,
    mouse_x - this.x);

  this.isShieldActive = input[BUTTONS.ALTERNATE_FIRE];

  // move
  this.x += this.dx;
  this.y += this.dy;

  // stay within bounds
  if (this.x < 0) {
    this.x = 0;
  } else if (this.x > 32) {
    this.x = 32;
  }
  if (this.y < 0) {
    this.y = 0;
  } else if (this.y > 18) {
    this.y = 18;
  }
};

Character.prototype.applyMovementForce = function(input) {
  var fx = 0;
  var fy = 0;
  var shouldMove = false;
  if (input[BUTTONS.MOVE_UP]) { // W
    fy += -1;
    shouldMove = true;
  }
  if (input[BUTTONS.MOVE_DOWN]) { // S
    fy += 1;
    shouldMove = true;
  }
  if (input[BUTTONS.MOVE_LEFT]) { // A
    fx += -1;
    shouldMove = true;
  }
  if (input[BUTTONS.MOVE_RIGHT]) { // D
    fx += 1;
    shouldMove = true;
  }

  if (shouldMove) {
    var targetDirection = Math.atan2(fy, fx);

    fx = this.accelerationCoefficient * Math.cos(targetDirection);
    fy = this.accelerationCoefficient * Math.sin(targetDirection);

    this.dx += fx;
    this.dy += fy;
  }
};

Character.prototype.getCurrentDirection = function() {
  return Math.atan2(this.dy, this.dx);
};

Character.prototype.applyFrictionForce = function() {
  var currentDirection = this.getCurrentDirection();
  var currentSpeed = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
  var breakFx = - this.breakingCoefficient * Math.cos(currentDirection) * Math.pow(currentSpeed * 5, 2);
  var breakFy = - this.breakingCoefficient * Math.sin(currentDirection) * Math.pow(currentSpeed * 5, 2);
  this.dx += breakFx;
  this.dy += breakFy;
};

Character.prototype.render = function(ctx, player_next, coeff, img, name) {
  var bodyRadius = this.bodyRadius;
  ctx.save();
  ctx.translate(this.x * GU, this.y * GU);
  ctx.scale(GU * 0.005, GU * 0.005);
  ctx.font = (.5 * GU) + 'px Arial';
  var width = ctx.measureText(name).width;
  var padding = GU * 0.5;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(name , 0, -2.1 * GU);

  ctx.fillStyle = '#00f600';
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.05 * GU;
  var hpWidth = 3 * GU;
  this.hp = 2;
  ctx.fillRect(
      -hpWidth / 2,
      -1.8 * GU,
      hpWidth * this.hp / 10, 0.2 * GU);

  ctx.strokeRect(
      -hpWidth / 2 - 0.1 * GU,
      -1.9 * GU,
      hpWidth + 0.2 * GU, 0.4 * GU);

  ctx.rotate(this.mouseDirection);
  ctx.drawImage(img, -img.width / 2, -img.height / 2 - 52);
  


  if (this.isShieldActive) {
    ctx.beginPath();
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 80;
    ctx.arc(
      0,
      0,
      300,
      -0.2 * Math.PI,
      0.2 * Math.PI,
      false
    );
    ctx.stroke();
  }
  ctx.restore();
};

module.exports = Character;
