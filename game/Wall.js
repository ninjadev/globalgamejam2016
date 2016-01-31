try {
  window;
} catch(e) {
  var utility = require('./../game/utility');
}

function Wall(start_x, start_y, end_x, end_y) {
  this.start_x = start_x;
  this.start_y = start_y;
  this.end_x = end_x;
  this.end_y = end_y
}

Wall.prototype.init = function(){
}

Wall.prototype.update = function() {
}

Wall.prototype.render = function(ctx, wall_next, coeff) {
	// Currently not used as this is treated serverside.
  ctx.translate(this.start_x * GU, this.start_y * GU);

  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.lineTo((this.end_x - this.start_x) * GU,
             (this.end_y - this.start_y) * GU);
  ctx.stroke();

}

Wall.prototype.getState = function() {
  return {
    start_x: this.start_x,
    start_y: this.start_y,
    end_x: this.end_x,
    end_y: this.end_y,
  }
}

Wall.prototype.getPushVector = function(center_x, center_y, radius){
  var v = {x: this.start_x, y: this.start_y};
  var w = {x: this.end_x, y: this.end_y};
  var p = {x: center_x, y: center_y};

  var l2 = dist2(v, w);
  if (l2 == 0) return dist_v(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0) return dist_v(p, v);
  if (t > 1) return dist_v(p, w);
  return dist_v(p, { x: v.x + t * (w.x - v.x),
    y: v.y + t * (w.y - v.y) });
}

function sqr(x) { return x * x }
function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }
function dist_v(v, w) { return {x: v.x - w.x, y:v.y - w.y } }




module.exports = Wall;
