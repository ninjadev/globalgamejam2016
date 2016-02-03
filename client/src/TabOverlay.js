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

  ctx.translate(0, line_height);

  ctx.textAlign = 'left';
  ctx.font = 0.4 * GU + 'px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText("LIGHT", light_pos, light_line * line_height + col_start);
  ctx.fillText("DARK", dark_pos, dark_line * line_height + col_start);
  dark_line+=2;
  light_line+=2;


  ctx.font = 0.3 * GU + 'px monospace';
  ctx.fillStyle = 'white';

  for(var i in players) {
      var player = players[i];
      var name = local_players[i].name;
      var team = player.team;
      console.log(player);
      var playerString = '' + player.kills + 'K/' + player.deaths + 'D/' + player.captures+'C ' +  name; 
      switch(team){
        case 0:
          //light
          ctx.fillText(playerString, light_pos, light_line * line_height + col_start);
          light_line++;
          break;
        case 1:
          //dark
          ctx.fillText(playerString, dark_pos, dark_line * line_height + col_start);
          dark_line++;
          break;
      }
  }
  ctx.restore();
}
