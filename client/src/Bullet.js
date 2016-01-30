function Bullet() {
}


bullet.prototype.init = function(x, y, dx, dy){
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
}

bullet.prototype.update = function(){
  this.x += this.dx;
  this.y += this.dy;
}

bullet.prototype.render = function() {
  ctx.beginPath();
  ctx.arc(this.x*GU, this.y*GU, GU*0.2, 0, 2 * Math.PI, false);
  ctx.fill();
}




