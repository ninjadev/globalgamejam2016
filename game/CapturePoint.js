
last_cp_id = 0;

function CapturePoint(x, y) {
  this.x = x;
  this.y = y;
  this.radius = 3;
  this.radiusSq = this.radius * this.radius;
  this.id = last_cp_id++;
  this.ownage_d = 0;
}


CapturePoint.prototype.init = function(){
}

CapturePoint.prototype.update = function(clients){
  //calculate number of people standing on me.
  var light = 0;
  var dark = 0;
  for(var i in clients) {
    if(!clients.hasOwnProperty(i)) {
      continue;
    }
    if(!clients[i].player){
      continue;
    }
    var character = clients[i].player.character;
    if(this.sqDistToPlayer(character) < this.radiusSq){
      switch(character.team){
        case 0:
          light++;
          break;
        case 1:
          dark++;
          break;
      }
    }
  }

  this.ownage_d += (Math.min(dark, 1) - Math.min(light, 1)) / 100;

  this.ownage_d = Math.max(-1, Math.min(1, this.ownage_d));
}

CapturePoint.prototype.sqDistToPlayer = function(character){
  var dx = character.x - this.x;
  var dy = character.y - this.y;
  return dx*dx + dy*dy;
}

CapturePoint.prototype.render = function(ctx, cpNext, neutralImg) {
  ctx.save();
  ctx.translate(this.x * GU, this.y * GU);
  var scale = 0.6;
  ctx.scale(scale, scale);
  /*
  ctx.drawImage(
      neutralImg,
      -neutralImg.width / 2,
      -neutralImg.height / 2);
  */

  var radius = 1.6 * GU; //pentagram radius
  var outerRadius = 2.6 * GU;

  if(this.ownage_d == 1) {
    ctx.fillStyle = 'rgba(20, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if(this.ownage_d == -1) {
    ctx.fillStyle = 'rgba(255, 255, 200, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  var step = 216 / 360 * Math.PI * 2;
  ctx.setLineDash([Math.max(this.ownage_d, 0) * 15.4 * GU, 999999])
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

  ctx.beginPath();
  ctx.setLineDash([Math.max(-this.ownage_d, 0) * 7.4 * GU, 999999])
  ctx.arc(0.5 * GU, 0, GU, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(-0.5 * GU, 0, GU, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.setLineDash([outerRadius * Math.PI * 2 / 16, outerRadius * Math.PI * 2 / 16]);
  ctx.lineWidth = 0.3 * GU;
  ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  if(this.ownage_d > 0) {
    ctx.strokeStyle = '#b01616';
  } else if(this.ownage_d < 0) {
    ctx.strokeStyle = '#c7af0e';
  }
  ctx.arc(0, 0, outerRadius, 0, Math.abs(this.ownage_d) * Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

CapturePoint.prototype.get_ownage_d = function() {
  return this.ownage_d;
}

CapturePoint.prototype.set_ownage_d = function(ownage_d) {
  this.ownage_d = ownage_d;
}

CapturePoint.prototype.getState = function() {
  return {
    x: this.x,
    y: this.y,
    ownage_d: this.ownage_d,
  }
}

module.exports = CapturePoint;
