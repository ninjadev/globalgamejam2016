
function Chat(){
  this.open = false;
  this.inputForm = document.createElement("input");
  this.inputForm.type = "text";
  this.inputForm.className = "chat-input";
  this.inputForm.style.display = 'none';
  this.inputForm.blur();

  this.chatWindow = document.createElement("div");
  this.chatWindow.className = "chat-window";

  var body = document.querySelector("body");
  body.appendChild(this.inputForm);
  body.appendChild(this.chatWindow);
}

Chat.prototype.displayMessage = function(msg){
  var p = document.createElement('p');
  p.className = 'chat-msg';
  p.textContent = msg;
  this.chatWindow.appendChild(p);
  setTimeout(function() {
    p.className += ' hidden';
    setTimeout(function() {
      p.style.display = 'none'; //Remove after fade-out animation
    }, 1000);
  }, 10000);
}


Chat.prototype.hitEnter = function(websocket, websocketReady){
  if(!this.open){
    this.open = true;
    this.inputForm.style.display = 'block';
    this.inputForm.focus();
  }else{
    if(this.inputForm.value != ''){
      this.sendChatMessage(websocket, websocketReady);
    }
    this.open = false;
    this.inputForm.style.display = 'none';
    this.inputForm.value = '';
    this.inputForm.blur();
  }
}

Chat.prototype.sendChatMessage = function(websocket, websocketReady){
  if(websocketReady){
    websocket.send(JSON.stringify({
      type: 'chat',
      message: this.inputForm.value       
    }));
  }
}
