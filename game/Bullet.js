try {
  window;
} catch(e) {
  var utility = require('./../game/utility');
}

function Bullet() {
  this.SPEED = 0.3;
  this.WEAPON_DISTANCE = 0.1;
}

Bullet.prototype.init = function(x, y, dx, dy){
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.active = true;
}

Bullet.prototype.fire = function(character, fire_dir_x, fire_dir_y){
          var x = character.x + (character.bodyRadius + this.WEAPON_DISTANCE) * fire_dir_x;
          var y = character.y + (character.bodyRadius + this.WEAPON_DISTANCE) * fire_dir_y;
          var dx = fire_dir_x * this.SPEED + character.dx;
          var dy = fire_dir_y * this.SPEED + character.dy;
          this.init(x, y, dx, dy);
          return this;
}

Bullet.prototype.update = function(clients){
    var newX = this.x + this.dx;
    var newY = this.y + this.dy;
    if(checkCollisionWithPlayers(clients,this, this.x, this.y, newX, newY)){
      this.active = false;
    }else{
      this.x = newX;
      this.y = newY;
    }

    if(this.x > 16 
      || this.y > 9
      || this.y < 0
      || this.y < 0){

      this.active = false;
    }
}

Bullet.prototype.render = function() {
  ctx.beginPath();
  ctx.arc(this.x*GU, this.y*GU, GU*0.2, 0, 2 * Math.PI, false);
  ctx.fill();
}

function checkCollisionWithPlayers(clients,bullet, oldX, oldY, newX, newY){
  var hit = false;
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    var character = clients[i].player.character;
    if(utility.intersectLineCircle(oldX, oldY, newX, newY, character.x, character.y, character.bodyRadius)){
      character.hit(bullet);
      hit = true;
    }
  }
  return hit;
}

module.exports = Bullet;
