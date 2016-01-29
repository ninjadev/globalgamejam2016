var ws = new WebSocket('ws://localhost:1234', 'echo-protocol');

function sendMessage(){
  var message = document.getElementById('message').value;
  ws.send(message);
}

ws.addEventListener("message", function(e) {
  // The data is simply the message that we're sending back
  var msg = e.data;

  // Append the message
  document.getElementById('chatlog').innerHTML += '<br>' + msg;
});
