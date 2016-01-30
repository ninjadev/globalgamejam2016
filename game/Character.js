try {
  window;
} catch(e) {
  var BUTTONS = require('./input');
}



function Character(team) {
  this.breakingCoefficient = 0.04;
  this.accelerationCoefficient = 0.01;
  this.bodyRadius = 0.4;
  this.MAX_HP = 10;
  this.team = team;
  this.init();
}

Character.MAX_SHIELD_ARC = 0.2 * Math.PI;
Character.OVERHEAT_THRESHOLD = 1.5;

Character.prototype.init = function() {
  this.x = Math.random() * 64;
  this.y = Math.random() * 64;
  this.dx = 0;
  this.dy = 0;
  this.hp = this.MAX_HP;
  this.isShieldActive = false;
  this.fireCooldown = 0;
  this.shieldEnergy = 1;
  this.weaponHeat = 0;
  this.overheated = false;
};

Character.prototype.getState = function() {
  return {
    t: 'C',
    x: this.x,
    y: this.y,
    hp: this.hp,
    mouseDirection: this.mouseDirection,
    isShieldActive: this.isShieldActive,
    shieldEnergy: this.shieldEnergy,
    team: this.team,
    weaponHeat: this.weaponHeat,
    overheated: this.overheated
  };
};

Character.prototype.hit = function(bullet) {
  if(bullet.team == this.team){
    return;
  }

  if (this.canShieldTakeBullet(bullet)) {
    this.shieldEnergy *= 0.25;
  } else {
    this.dx += bullet.dx;
    this.dy += bullet.dy;

    this.hp --;
    if(this.hp <= 0){
      this.init();
    }
  }
};

Character.prototype.canShieldTakeBullet = function(bullet) {
  if (!this.isShieldActive) {
    return false;
  }
  var mouseDirection = this.mouseDirection;
  if (mouseDirection < 0) {
    mouseDirection += 2 * Math.PI;
  }
  var oppositeShieldDirection = mouseDirection + Math.PI;
  var minShieldDirection = oppositeShieldDirection - Character.MAX_SHIELD_ARC * this.shieldEnergy;
  var maxShieldDirection = oppositeShieldDirection + Character.MAX_SHIELD_ARC * this.shieldEnergy;
  var bulletDirection = bullet.direction + 2 * Math.PI;
  return bulletDirection <= maxShieldDirection && bulletDirection >= minShieldDirection;
};

Character.prototype.update = function(input) {
  this.applyMovementForce(input);
  this.applyFrictionForce();
  var mouse_x = input[BUTTONS.MOUSE_X] || 0;
  var mouse_y = input[BUTTONS.MOUSE_Y] || 0;
  this.mouseDirection = Math.atan2(
    mouse_y - this.y,
    mouse_x - this.x);

  this.isShieldActive = input[BUTTONS.ALTERNATE_FIRE];
  this.shieldEnergy += 0.003;
  if (this.shieldEnergy > 1) {
    this.shieldEnergy = 1;
  }

  this.weaponHeat -= this.overheated ? 0.005 : 0.01;
  if (this.weaponHeat < 0) {
    this.weaponHeat = 0;
  }
  if (this.weaponHeat < 1) {
    this.overheated = false;
  }

  // move
  this.x += this.dx;
  this.y += this.dy;

  // stay within bounds
  if (this.x < 0) {
    this.x = 0;
  } else if (this.x > 64) {
    this.x = 64;
  }
  if (this.y < 0) {
    this.y = 0;
  } else if (this.y > 64) {
    this.y = 64;
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
  var activeShieldFactor = this.isShieldActive ? 2.5 : 1; // more friction while shield is active
  var frictionScalar = - activeShieldFactor * this.breakingCoefficient * Math.pow(currentSpeed * 5, 2);
  var breakFx = frictionScalar * Math.cos(currentDirection);
  var breakFy = frictionScalar * Math.sin(currentDirection);
  this.dx += breakFx;
  this.dy += breakFy;
};

Character.prototype.render = function(ctx, player_next, coeff, lightImg, darkImg, name) {
  if(!player_next)return; //TODO: When should bullet dissapear?
  var x = this.x * (1 - coeff) + player_next.x * coeff;
  var y = this.y * (1 - coeff) + player_next.y * coeff;
  var hp = this.hp * (1 - coeff) + player_next.hp * coeff;

  var bodyRadius = this.bodyRadius;
  ctx.save();
  ctx.translate(x * GU, y * GU);
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
  ctx.fillRect(
      -hpWidth / 2,
      -1.8 * GU,
      hpWidth * hp / 10, 0.2 * GU);

  ctx.strokeRect(
      -hpWidth / 2 - 0.1 * GU,
      -1.9 * GU,
      hpWidth + 0.2 * GU, 0.4 * GU);

  ctx.rotate(this.mouseDirection);
  var img = this.team == 0 ? lightImg : darkImg;
  ctx.drawImage(img, -img.width / 2, -img.height / 2 - 52);
  
  if (this.isShieldActive) {
    ctx.beginPath();
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 20  + 20 * this.shieldEnergy;
    ctx.arc(
      0,
      0,
      300,
      -Character.MAX_SHIELD_ARC * this.shieldEnergy,
      Character.MAX_SHIELD_ARC * this.shieldEnergy,
      false
    );
    ctx.stroke();
  }
  ctx.restore();
};

Character.prototype.renderUi = function(ctx) {
  // draw overheat indicator
  ctx.save();
  var fillAlpha = 0.5;
  if (this.overheated) {
    fillAlpha += Math.sin(0.02 * t);
  }
  ctx.fillStyle = 'rgba(176, 22, 22, ' + fillAlpha + ')';
  ctx.strokeStyle = 'rgba(93, 25, 25, 1)';
  ctx.strokeWidth = 0.1 * GU;
  ctx.fillRect(0.5 * GU, 8.5 * GU, GU * this.weaponHeat, 0.2 * GU);
  ctx.strokeRect(0.5 * GU, 8.5 * GU, GU * Character.OVERHEAT_THRESHOLD, 0.2 * GU);
  ctx.restore();
};

module.exports = Character;
