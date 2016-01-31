function MusicManager(){
  this.audioButton = new AudioButton();
	this.music = new Audio();
    this.loaded = false;
    var that = this;
    loaded++;
	this.music.addEventListener("loadeddata", function(){that.loaded||loaded--;that.loaded = true;this.play()});
	this.music.addEventListener("canplay", function(){that.loaded||loaded--;that.loaded = true;this.play()});
    this.music.volume = 0.4;
    this.music.src = "res/zik.mp3";
	this.state = "menu";
	this.musictimes = {
		menustart: 30.96,
		menuend: 60 + 1.93,
		menulength: 60 + 1.93 - 30.96,
		gamestart: 60 + 31.69,
		gameend: 180 + 5.80,
		gamelength: 180 + 5.80 - 60 - 32.90

	}
    document.body.appendChild(this.music);
}

MusicManager.prototype.changeState = function(state){
	this.state = state;
}

MusicManager.prototype.update = function(){
    if(this.loaded){
        if(this.state == "menu" && this.music.currentTime > this.musictimes.menuend){
            this.music.currentTime -= this.musictimes.menulength;
        }else if(this.state == "game" && this.music.currentTime < this.musictimes.gamestart){
            this.music.currentTime = this.musictimes.gamestart;
        }
        else if(this.music.currentTime > this.musictimes.gameend){
            this.music.currentTime -= this.musictimes.gamelength;
        }
    }
}

