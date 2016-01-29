
function join(){
  var message = document.getElementById('message').value;
  var ws = new WebSocket('ws://localhost:1337', 'echo-protocol');
  ws.addEventListener('open', function(e) {
    ws.send(message);
  });
  ws.addEventListener("message", function(e) {
    // The data is simply the message that we're sending back
    console.log(e);
    var players = JSON.parse(e.data);
    console.log(players);
    var playersHtml = "";
    for (var i = 0; i < players.length; i++) {
      playersHtml += '<li>' + JSON.stringify(players) + '</li>';
    }
    document.getElementById('players').innerHTML = playersHtml;

  });
}
