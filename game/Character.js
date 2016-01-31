try {
  window;
} catch(e) {
  var BUTTONS = require('./input');
}

function Character(team, spawnPoint) {
  this.breakingCoefficient = 0.025;
  this.accelerationCoefficient = 0.012;
  this.bodyRadius = 0.6;
  this.MAX_HP = 10;
  this.team = team;
  this.onCP = false;
  this.kills = 0;
  this.deaths = 0;
  this.init(spawnPoint);
}

Character.MAX_SHIELD_ARC = 0.2 * Math.PI;
Character.OVERHEAT_THRESHOLD = 1.5;

Character.prototype.init = function(spawnPoint) {
  if (spawnPoint) {
    this.x = spawnPoint.x;
    this.y = spawnPoint.y;
    this.timeDied = null;
    this.timeToRespawn = 0;
  } else {
    this.x = 32;
    this.y = 32;
    this.timeDied = +new Date();
    this.timeToRespawn = this.getTimeUntilRespawn(this.timeDied);
  }

  this.dx = 0;
  this.dy = 0;
  this.hp = this.MAX_HP;
  this.isShieldActive = false;
  this.fireCooldown = 0;
  this.shieldEnergy = 1;
  this.weaponHeat = 0;
  this.overheated = false;
  this.points = 0;
  this.respawnTime = 4000;
};

Character.prototype.getState = function() {
  return {
    t: 'C',
    x: this.x,
    y: this.y,
    hp: this.hp,
    kills: this.kills,
    deaths: this.deaths,
    mouseDirection: this.mouseDirection,
    isShieldActive: this.isShieldActive,
    shieldEnergy: this.shieldEnergy,
    team: this.team,
    weaponHeat: this.weaponHeat,
    overheated: this.overheated,
    respawnTime: this.respawnTime,
    timeDied: this.timeDied,
    timeToRespawn: this.timeToRespawn
  };
};

Character.prototype.hit = function(bullet, soundsToPlay) {
  if (bullet.team == this.team){
    return;
  }

  if (this.canShieldTakeBullet(bullet)) {
    this.shieldEnergy -= 0.45;
    var shieldSoundIndex = Math.floor(3 * Math.random()) + 1;
    soundsToPlay['shield-hit-' + shieldSoundIndex + '.mp3'] = true;
  } else {
    this.dx += bullet.dx;
    this.dy += bullet.dy;

    this.hp --;
    if (this.hp <= 0){
      this.deaths++;
      if(bullet.character){
        bullet.character.killed(this);
      }
      this.die();
    }
  }
};

Character.prototype.killed = function(enemy){
  //YEEY
  this.kills++;
};


Character.prototype.die = function(){
  this.hp = 0;
  this.timeDied = +new Date();
  this.respawnTime = 1000 + this.points * 0.3;
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
  var minShieldDirection = oppositeShieldDirection - Character.MAX_SHIELD_ARC * Math.max(this.shieldEnergy, 0);
  var maxShieldDirection = oppositeShieldDirection + Character.MAX_SHIELD_ARC * Math.max(this.shieldEnergy, 0);
  var bulletDirection = bullet.direction + 2 * Math.PI;
  return bulletDirection <= maxShieldDirection && bulletDirection >= minShieldDirection;
};

Character.prototype.getTimeUntilRespawn = function(timeDied) {
  var currentTime = +new Date();
  return Math.max(timeDied + this.respawnTime - currentTime, 0);
};

var defaultSpawn = [{x:5, y:32}, {x:55, y:32}];
Character.getDefaultPoint = function(team) {
  return defaultSpawn[team];
};

Character.getClosestSpawnPoint = function(team, character, capturePoints) {
  var spawnPoint = defaultSpawn[team];
  var dist = 999999; //bigger than map.
  for (var i = 0; i < capturePoints.length; i++) {
    var capturePoint = capturePoints[i];
    if (team === 0 && capturePoint.ownage_d === -1 || team === 1 && capturePoint.ownage_d === 1) {
      if(capturePoint.sqDistanceTo(character) < dist){
        spawnPoint = capturePoint;
      }
    }
  }
  return spawnPoint;
};
Character.prototype.update = function(input, walls, utility, capturePoints, points) {
  this.points = points;
  if (this.timeDied) {
    this.timeToRespawn = this.getTimeUntilRespawn(this.timeDied);
    if (this.timeToRespawn <= 0) {
      var spawnPoint = Character.getClosestSpawnPoint(this.team,this, capturePoints);
      if (spawnPoint) {
        this.init(spawnPoint);
      }
    }
    return;
  }

  this.applyMovementForce(input);
  this.applyFrictionForce();
  this.mouseDirection = input[BUTTONS.MOUSE_DIR];

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


  for(var i = 0; i < walls.length; i++) {
    if(utility.intersectLineCircle(walls[i].start_x, walls[i].start_y, walls[i].end_x, walls[i].end_y, this.x, this.y, this.bodyRadius)) {
      var p = walls[i].getPushVector(this.x, this.y, this.bodyRadius);
      
      //Decompose velocity!
      var newDx = 0;
      var newDy = 0;

      
      var p_l = Math.sqrt(p.x * p.x + p.y * p.y);
      if(p_l > 0.0001){
        p = { x: p.x/p_l, y: p.y / p_l }

        var newSpeed = p.x * this.dx + p.y * this.dy;
        if(newSpeed > 0){ //Moving away from wall. this is ok.
          newDx += p.x * newSpeed;
          newDy += p.y * newSpeed;
        }

      }

      var n = { x: -p.y, y: p.x };
      var n_l = Math.sqrt(n.x * n.x + n.y * n.y);
      if(n_l > 0.0001){
        n = { x: n.x/n_l, y: n.y / n_l }

        var newSpeed = n.x * this.dx + n.y * this.dy;
        newDx += n.x * newSpeed;
        newDy += n.y * newSpeed;
      }

      this.dx = newDx;
      this.dy = newDy;
    }
  }
    
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
  var activeShieldFactor = this.isShieldActive ? 2.2 : 1; // more friction while shield is active
  var frictionScalar = - activeShieldFactor * this.breakingCoefficient * Math.pow(currentSpeed * 5 +.15, 2);
  var breakFx = frictionScalar * Math.cos(currentDirection);
  var breakFy = frictionScalar * Math.sin(currentDirection);
  this.dx += breakFx;
  this.dy += breakFy;
};

Character.prototype.render = function(ctx, player_next, coeff, lightImg, darkImg, name) {
  if (!player_next) {
    return;
  }
  var x = this.x * (1 - coeff) + player_next.x * coeff;
  var y = this.y * (1 - coeff) + player_next.y * coeff;

  if (this.timeToRespawn) {
    ctx.save();
    ctx.translate(x * GU, y * GU);
    ctx.scale(1.2, 1.2);
    ctx.font = GU + 'px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(name + ' is dead (' + Math.ceil(this.timeToRespawn / 1000).toString() + ')', 0, 0);
    ctx.restore();
    return;
  }

  var hp = this.hp * (1 - coeff) + player_next.hp * coeff;

  var bodyRadius = this.bodyRadius;
  ctx.save();
  ctx.translate(x * GU, y * GU);
  ctx.scale(0.6, 0.6);
  ctx.font = (.5 * GU) + 'px Arial';
  var width = ctx.measureText(name).width;
  var padding = GU * 0.5;
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.fillText(name , 0, -2.1 * GU);

  ctx.fillStyle = 'white';
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

  ctx.restore();
  ctx.save();

  ctx.translate(x * GU, y * GU);
  ctx.scale(GU * 0.005, GU * 0.005);
  ctx.rotate(this.mouseDirection);
  var img = this.team == 0 ? lightImg : darkImg;
  ctx.drawImage(img, -img.width / 2, -img.height / 2 - 52);

  ctx.restore();
  ctx.save();

  ctx.translate(x * GU, y * GU);
  ctx.scale(0.6, 0.6);
  ctx.rotate(this.mouseDirection);
  
  if (this.isShieldActive && this.shieldEnergy > 0) {
    ctx.beginPath();
    ctx.strokeStyle = '#BCBCBC';
    ctx.lineWidth = 10  + 10 * this.shieldEnergy;
    ctx.arc(
      0,
      0,
      180,
      -Character.MAX_SHIELD_ARC * Math.max(this.shieldEnergy, 0),
      Character.MAX_SHIELD_ARC * Math.max(this.shieldEnergy, 0),
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
  if(fillAlpha > 0.5) {
    ctx.fillStyle = 'rgba(255, 255, 255, ' + fillAlpha + ')';
  } else {
    ctx.fillStyle = 'rgba(255, 2555, 255, ' + fillAlpha + ')';
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
  ctx.strokeWidth = 0.1 * GU;
  ctx.fillRect(0.5 * GU, 8.5 * GU, GU * this.weaponHeat, 0.2 * GU);
  ctx.strokeRect(0.5 * GU, 8.5 * GU, GU * Character.OVERHEAT_THRESHOLD, 0.2 * GU);
  ctx.restore();
};

module.exports = Character;
