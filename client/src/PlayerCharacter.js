function PlayerCharacter() {
  this.breakingCoefficient = 0.04;
  this.accelerationCoefficient = 0.01;
  this.bodyRadius = 0.2;
}

PlayerCharacter.prototype.init = function() {
  this.x = Math.random() * 16;
  this.y = Math.random() * 9;
  this.dx = 0;
  this.dy = 0;
  this.isShieldActive = false;
};

PlayerCharacter.prototype.update = function() {
  this.applyMovementForce();
  this.applyFrictionForce();

  this.isShieldActive = MOUSE.right;

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

PlayerCharacter.prototype.applyMovementForce = function() {
  var fx = 0;
  var fy = 0;
  var shouldMove = false;
  if (KEYS[87]) { // W
    fy += -1;
    shouldMove = true;
  }
  if (KEYS[83]) { // S
    fy += 1;
    shouldMove = true;
  }
  if (KEYS[65]) { // A
    fx += -1;
    shouldMove = true;
  }
  if (KEYS[68]) { // D
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

PlayerCharacter.prototype.getCurrentDirection = function() {
  return Math.atan2(this.dy, this.dx);
};

PlayerCharacter.prototype.applyFrictionForce = function() {
  var currentDirection = this.getCurrentDirection();
  var currentSpeed = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
  var breakFx = - this.breakingCoefficient * Math.cos(currentDirection) * Math.pow(currentSpeed * 5, 2);
  var breakFy = - this.breakingCoefficient * Math.sin(currentDirection) * Math.pow(currentSpeed * 5, 2);
  this.dx += breakFx;
  this.dy += breakFy;
};

PlayerCharacter.prototype.render = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.x * GU, this.y * GU, this.bodyRadius * GU, 0, 2 * Math.PI, false);
  ctx.fill();

  if (this.isShieldActive) {
    var directionToMouse = Math.atan2(MOUSE.y - this.y, MOUSE.x - this.x);
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 0.15 * this.bodyRadius * GU;
    ctx.arc(
      this.x * GU,
      this.y * GU,
      1.6 * this.bodyRadius * GU,
      directionToMouse - 0.2 * Math.PI,
      directionToMouse + 0.2 * Math.PI,
      false
    );
    ctx.stroke();
    ctx.restore();
  }
};
