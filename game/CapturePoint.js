
/* smoothstep interpolates between a and b, at time t from 0 to 1 */
function smoothstep(a, b, t) {
  var v = t * t * (3 - 2 * t);
  return b * v + a * (1 - v);
}

last_cp_id = 0;

function CapturePoint(x, y) {
  this.x = x;
  this.y = y;
  this.radius = 2.2;
  this.radiusSq = this.radius * this.radius;
  this.id = last_cp_id++;
  this.ownage_d = 0;
  this.locked_ownage = 0;
  this.old_ownage_d = 0;
  this.blast_timer = 0;
}


CapturePoint.prototype.init = function(){
}

CapturePoint.prototype.sqDistanceTo = function(vec) {
  var dx = vec.x - this.x;
  var dy = vec.y - this.y;

  return dx * dx + dy * dy;
  
}


function sign(x) {
  if(x < 0) {
    return -1;
  }
  return 1;
}

CapturePoint.MAX_BLAST_TIMER = 40;


CapturePoint.prototype.update = function(clients){
  if(this.blast_timer > 0) {
    this.blast_timer--;
  }
  if(Math.abs(this.ownage_d) == 1 && this.ownage_d != this.old_ownage_d) {
    this.blast_timer = CapturePoint.MAX_BLAST_TIMER;
  }
  this.old_ownage_d = this.ownage_d;
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
    if (!character.timeDied && this.sqDistToPlayer(character) < this.radiusSq) {
      switch (character.team) {
        case 0:
          light++;
          break;
        case 1:
          dark++;
          break;
      }
    }
  }

  this.ownage_d += (Math.min(dark, 1) - Math.min(light, 1)) / 120;

  this.ownage_d = Math.max(-1, Math.min(1, this.ownage_d));

  // Lock the point if locking is apropriate.
  if(this.ownage_d == 1)
    this.locked_ownage = 1;
  if(this.ownage_d == -1)
    this.locked_ownage = -1;
  if(this.locked_ownage!=0 && sign(this.locked_ownage) != sign(this.ownage_d))
    this.locked_ownage = 0;

  if(light == 0 && dark == 0 && Math.abs(this.ownage_d) < 1 &&
     Math.abs(this.ownage_d) > 0) {
    this.ownage_d -= (this.locked_ownage==0?1:-1) * sign(this.ownage_d) * 1 / 120;
    if(Math.abs(this.ownage_d) <= 1 / 120) {
      this.ownage_d = 0;
    }
  }
}

CapturePoint.prototype.sqDistToPlayer = function(character){
  var dx = character.x - this.x;
  var dy = character.y - this.y;
  return dx*dx + dy*dy;
}

CapturePoint.prototype.render = function(ctx, cpNext, neutralImg, ui) {
  if(ui){ //overloading hack, yo!
    var x = this.x/15 ;
    var y = this.y/15 - 1.2 ;
    var scale = 0.08;
  }else{
    var x = this.x;
    var y = this.y;
    var scale = 0.6;
  }

  ctx.save();
  ctx.translate(x * GU, y * GU);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  } else if(this.ownage_d == -1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  if(this.blast_timer) {
    var falloff = smoothstep(0, 2,  this.blast_timer / CapturePoint.MAX_BLAST_TIMER / 2);
    if(this.ownage_d < 0) {
      ctx.fillStyle = 'rgba(255, 255, 255,  ' + (falloff * 0.8) + ')';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0,  ' + (falloff * 0.8) + ')';
    }
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius + (1/CapturePoint.MAX_BLAST_TIMER) * 2 * GU * (CapturePoint.MAX_BLAST_TIMER - this.blast_timer), 0, Math.PI * 2);
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
    ctx.strokeStyle = '#191919';
  } else if(this.ownage_d < 0) {
    ctx.strokeStyle = '#ffffff';
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
    blast_timer: this.blast_timer
  }
}

module.exports = CapturePoint;
