function CapturePoint(x, y) {
  this.x = y;
  this.y = x;
}


CapturePoint.prototype.init = function(){
  this.ownage_d = 1;
}

CapturePoint.prototype.update = function(){
	this.ownage_d = (new Date()).getMilliseconds() / 500 - 1;
}

CapturePoint.prototype.render = function(ctx) {
  ctx.fillStyle = this.ownage_d>0?'#FF0000':'#0000FF';
  ctx.beginPath();
  ctx.arc(this.x*GU, this.y*GU, GU*0.2, 0, 2 * Math.PI * Math.abs(this.ownage_d), false);
  ctx.fill();
}

CapturePoint.prototype.get_ownage_d = function() {
  return this.ownage_d;
}

CapturePoint.prototype.set_ownage_d = function(ownage_d) {
  this.ownage_d = ownage_d;
}
