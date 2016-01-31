function TabOverlay(){

}

TabOverlay.render = function(ctx, players, local_players){
  ctx.save();
  ctx.translate(2 * GU, 2 * GU);
  ctx.fillStyle = "rgba(60,60,60,0.8)";
  ctx.fillRect(0,0, 12 * GU, 5 * GU);

  var light_pos = 3 * GU;
  var dark_pos = 7 * GU;

  var line_height = 0.4 * GU;
  var light_line = 0;
  var dark_line = 0;
  var col_start = 0.5 * GU;

  ctx.textAlign = 'left';
  ctx.font = 0.4 * GU + 'px serif';
  ctx.fillStyle = 'white';
  ctx.translate(0, line_height);
  ctx.fillText("Light team", light_pos, light_line * line_height + col_start);
  ctx.fillText("Dark team", dark_pos, dark_line * line_height + col_start);
  dark_line+=2;
  light_line+=2;

  ctx.font = 0.3 * GU + 'px serif';
  ctx.fillStyle = 'white';

  for(var i in players) {
      var player = players[i];
      var name = local_players[i].name;
      var team = player.team;
      switch(team){
        case 0:
          //light
          ctx.fillText(name, light_pos, light_line * line_height + col_start);
          light_line++;
          break;
        case 1:
          //dark
          ctx.fillText(name, dark_pos, dark_line * line_height + col_start);
          dark_line++;
          break;
      }
  }
  ctx.restore();
}
