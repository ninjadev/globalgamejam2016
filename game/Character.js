try {
  window;
} catch(e) {
  var BUTTONS = require('./input');
}


function Character() {
  this.breakingCoefficient = 0.04;
  this.accelerationCoefficient = 0.01;
  this.bodyRadius = 0.4;
  this.init();
}

Character.prototype.init = function() {
  this.x = 0;
  this.y = 0;
  this.dx = 0;
  this.dy = 0;
  this.isShieldActive = false;
  this.fireCooldown = 0;
};

Character.prototype.getState = function() {
  return {
    t: 'C',
    x: this.x,
    y: this.y,
    mouseDirection: this.mouseDirection,
    isShieldActive: this.isShieldActive
  };
}

Character.prototype.hit = function(bullet) {
  this.dx += bullet.dx ;
  this.dy += bullet.dy ;
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
  } else if (this.x > 16) {
    this.x = 16;
  }
  if (this.y < 0) {
    this.y = 0;
  } else if (this.y > 9) {
    this.y = 9;
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

Character.prototype.render = function(ctx, img) {
  var bodyRadius = 0.2;
  ctx.save();
  ctx.translate(this.x * GU, this.y * GU);
  ctx.scale(GU * 0.005, GU * 0.005);
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
