function CapturePoint(x, y) {
  this.x = x;
  this.y = y;
  this.neutralImg = loadImage('res/marker.png');
}


CapturePoint.prototype.init = function(){
  this.ownage_d = 1;
}

CapturePoint.prototype.update = function(){
	this.ownage_d = Math.sin(+new Date() / 1000);
}

CapturePoint.prototype.render = function(ctx) {
  ctx.save();
  ctx.translate(this.x * GU, this.y * GU);
  ctx.drawImage(
      this.neutralImg,
      -this.neutralImg.width / 2,
      -this.neutralImg.height / 2);


  ctx.strokeStyle = 'black';
  ctx.beginPath();
  var radius = 1.6 * GU;
  var step = 216 / 360 * Math.PI * 2;
  ctx.setLineDash([2000 * this.ownage_d + 1, 2000])
  ctx.lineWidth = 0.05 * GU;
  ctx.lineTo(Math.sin(step) * radius,
             Math.cos(step) * radius);
  ctx.lineTo(Math.sin(step * 2) * radius,
             Math.cos(step * 2) * radius);
  ctx.lineTo(Math.sin(step * 3) * radius,
             Math.cos(step * 3) * radius);
  ctx.lineTo(Math.sin(step * 4) * radius,
             Math.cos(step * 4) * radius);
  ctx.lineTo(Math.sin(step * 5) * radius,
             Math.cos(step * 5) * radius);
  ctx.lineTo(Math.sin(step * 6) * radius,
             Math.cos(step * 6) * radius);
  ctx.stroke();
  ctx.restore();
}

CapturePoint.prototype.get_ownage_d = function() {
  return this.ownage_d;
}

CapturePoint.prototype.set_ownage_d = function(ownage_d) {
  this.ownage_d = ownage_d;
}
