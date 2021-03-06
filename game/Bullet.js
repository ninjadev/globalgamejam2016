try {
  window;
} catch(e) {
  var utility = require('./../game/utility');
  var Character = require('./../game/Character');
}

Bullet.speed = 0.3;
Bullet.damage = 7;

function Bullet() {
  this.WEAPON_DISTANCE = 0.1;
}

last_bullet_id = 0;

Bullet.prototype.init = function(x, y, dx, dy, team){
  this.id = last_bullet_id++;
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.active = true;
  this.direction = Math.atan2(dy, dx);
  this.team = team;
};

Bullet.prototype.getDamage = function(){
  return Bullet.damage;
}

Bullet.prototype.fire = function(character, fire_dir_x, fire_dir_y){
  this.character = character;
  var x = character.x + (Character.BODY_RADIUS + this.WEAPON_DISTANCE) * fire_dir_x;
  var y = character.y + (Character.BODY_RADIUS +  this.WEAPON_DISTANCE) * fire_dir_y;
  var dx = fire_dir_x * Bullet.speed;
  var dy = fire_dir_y * Bullet.speed;
  this.init(x, y, dx, dy, character.team);
  return this;
};

Bullet.prototype.update = function(clients, walls, soundsToPlay){
    var newX = this.x + this.dx;
    var newY = this.y + this.dy;
    if (checkCollisionWithWalls(walls, this, this.x, this.y, newX, newY)
      || checkCollisionWithPlayers(clients,this, this.x, this.y, newX, newY, soundsToPlay)) {
      this.active = false;
    } else{
      this.x = newX;
      this.y = newY;
    }

    if(this.x > 64 
      || this.y > 64
      || this.x < 0
      || this.y < 0){

      this.active = false;
    }
};

Bullet.prototype.render = function(ctx, bullet_next, coeff) {
  //interpolation!
  if(!bullet_next)return; //TODO: When should bullet dissapear?
  var x = this.x * (1 - coeff) + bullet_next.x * coeff;
  var y = this.y * (1 - coeff) + bullet_next.y * coeff;

  //draw
  var light = 0;
  ctx.fillStyle = this.team == light ? 'white' : '#191919';
  ctx.save();
  ctx.translate(x * GU, y * GU);
  ctx.rotate(this.direction);
  ctx.fillRect(-GU / 2 / 2, - GU / 16 / 2, GU / 2, GU / 16);
  ctx.restore();
}

Bullet.prototype.getState = function() {
  return {
    x: this.x,
    y: this.y,
    direction: this.direction,
    team: this.team
  }
}

function checkCollisionWithPlayers(clients, bullet, oldX, oldY, newX, newY, soundsToPlay){
  var hit = false;
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    if(!clients[i].player){
      continue;
    }
    var character = clients[i].player.character;
    if (!character.timeDied && utility.intersectLineCircle(oldX, oldY, newX, newY, character.x, character.y, Character.BODY_RADIUS)) {
      character.hit(bullet, soundsToPlay);
      hit = true;
    }
  }
  return hit;
}

function checkCollisionWithWalls(walls, bullet, oldX, oldY, newX, newY){
  var hit = false;
  for(var i = 0; i < walls.length; i++) {

    if(utility.lineIntersect(oldX, oldY, newX, newY, walls[i].start_x, walls[i].start_y, walls[i].end_x, walls[i].end_y)) {
      hit = true;
    }
  }
  return hit;
}

module.exports = Bullet;
