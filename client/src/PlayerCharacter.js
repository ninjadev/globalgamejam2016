function PlayerCharacter() {
  this.breakingCoefficient = 0.04;
}

PlayerCharacter.prototype.init = function() {
  this.x = Math.random() * 16 * GU;
  this.y = Math.random() * 9 * GU;
  this.dx = 0;
  this.dy = 0;
};

PlayerCharacter.prototype.update = function() {
  var fx = 0;
  var fy = 0;
  var targetSpeed = 0;
  if (KEYS[87]) { // W
    fy += -1;
    targetSpeed = 1;
  }
  if (KEYS[83]) { // S
    fy += 1;
    targetSpeed = 1;
  }
  if (KEYS[65]) { // A
    fx += -1;
    targetSpeed = 1;
  }
  if (KEYS[68]) { // D
    fx += 1;
    targetSpeed = 1;
  }
  var targetDirection = Math.atan2(fy, fx);

  fx = targetSpeed * Math.cos(targetDirection);
  fy = targetSpeed * Math.sin(targetDirection);

  this.applyforce(fx, fy);

  // breaking force
  var actualDirection = Math.atan2(this.dy, this.dx);
  var currentSpeed = Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
  var breakFx = - this.breakingCoefficient * Math.cos(actualDirection) * Math.pow(currentSpeed, 2);
  var breakFy = - this.breakingCoefficient * Math.sin(actualDirection) * Math.pow(currentSpeed, 2);
  this.applyforce(breakFx, breakFy);

  this.x += this.dx;
  this.y += this.dy;

  if (this.x < 0) {
    this.x = 0;
  } else if (this.x > 16 * GU) {
    this.x = 16 * GU;
  }
  if (this.y < 0) {
    this.y = 0;
  } else if (this.y > 9 * GU) {
    this.y = 9 * GU;
  }
};

PlayerCharacter.prototype.applyforce = function(fx, fy) {
  this.dx += fx;
  this.dy += fy;
};

PlayerCharacter.prototype.render = function(ctx) {
  ctx.beginPath();
  ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI, false);
  ctx.fill();
};
