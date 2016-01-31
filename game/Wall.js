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

module.exports = Wall;
