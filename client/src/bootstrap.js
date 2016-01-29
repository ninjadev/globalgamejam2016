DEBUG = true;
GU = 10;

CENTER = {
  x: 8,
  y: 4.5
};

MOUSE = {x: 0, y: 0, left: false, right: false};

missedGFXFrames = 0;

/* smoothstep interpolates between a and b, at time t from 0 to 1 */
function smoothstep(a, b, t) {
  var v = t * t * (3 - 2 * t);
  return b * v + a * (1 - v);
}

function clamp(low, x, high) {
  return Math.max(low, Math.min(x, high));
}

function loadImage(path) {
  var img = new Image();
  loaded++;
  img.onload = function() {
    loaded--;
  };
  img.src = path;
  return img;
}

window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 0);
    };
})();

function loop() {
  if (loaded > 0) {
    canvas.width = canvas.width;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.fillText("Loading " + loaded, 8 * GU, 4.5 * GU);
    requestAnimFrame(loop);
    return;
  }
  t = +new Date();
  dt += (t - old_time);
  old_time = t;
  while (dt > 20) {
    sm.update();
    dt -= 20;
  }
  /* clearing canvas */
  canvas.width = canvas.width;
  sm.render(ctx);


  requestAnimFrame(loop);
}

function bootstrap() {

  loaded = 1;

  /* global on purpose */
  canvas = document.createElement("canvas");
  ctx = canvas.getContext("2d");
  canvas.style.zIndex = 999;
  game_data = readData();

  sm = new StateManager();

  AudioButton.prototype.sprite_on = loadImage("res/audio_on.png");
  AudioButton.prototype.sprite_off = loadImage("res/audio_off.png");

  dt = 0;
  t = 0;
  time = +new Date();
  old_time = time;
  KEYS = [];
  for (var i = 0; i < 256; i++) {
    KEYS[i] = false;
  }

  document.addEventListener("keydown", function(e) {
    KEYS[e.keyCode] = true;
  });

  document.addEventListener("keyup", function(e) {
    KEYS[e.keyCode] = false;
  });

  // prevent context menu from appearing on right click
  document.addEventListener('contextmenu', function(e) {
    console.log("context menu was suppressed");
    if (e.button === 2) {
      e.preventDefault();
      return false;
    }
  }, false);

  document.addEventListener("mousedown", function(e) {
    if (e.button === 0) {
      MOUSE.left = true;
    } else if (e.button === 2) {
      MOUSE.right = true;
    }
  });

  document.addEventListener("mouseup", function(e) {
    if (e.button === 0) {
      MOUSE.left = false;
    } else if (e.button === 2) {
      MOUSE.right = false;
    }
  });

  /* add game states here */

  sm.addState("game", new GameState());
  sm.addState("menu", new MenuState());

  document.body.appendChild(canvas);

  resize({});

  /* start the game */

  sm.changeState("menu");

  loaded--;
  requestAnimFrame(loop);
}

function resize(e) {
  if (window.innerWidth / window.innerHeight > 16 / 9) {
    GU = (window.innerHeight / 9);
  } else {
    GU = (window.innerWidth / 16);
  }
  if (typeof canvas !== "undefined") {
    canvas.width = 16 * GU;
    canvas.height = 9 * GU;
    canvas.style.margin = (($(window).height() - 9 * GU) / 2) + "px 0 0 " + (($(window).width() - 16 * GU) / 2) + "px";
    var wrapper = document.getElementById('wrapper');
    wrapper.style.margin = canvas.style.margin;
    wrapper.style.width = 16 * GU + 'px';
    wrapper.style.height = 9 * GU + 'px';
    wrapper.style.fontSize = 0.15 * GU + 'px';
    wrapper.style.zIndex = 99999999;
  }
}

function saveData(data) {
  json_data = JSON.stringify(data);
  setCookie("game_data", json_data, 10 ^ 5);
}

function readData() {
  json_data = getCookie("game_data");
  if (typeof json_data !== "undefined") {
    return JSON.parse(json_data);
  } else {
    /* default game_data object */
    return {progress: [0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1]};
  }
}

function setCookie(c_name, value, exdays) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + exdays);
  var c_value = encodeURIComponent(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
  document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
  var i, x, y, ARRcookies = document.cookie.split(";");
  for (i = 0; i < ARRcookies.length; i++) {
    x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
    y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
    x = x.replace(/^\s+|\s+$/g, "");
    if (x == c_name) {
      return decodeURIComponent(y);
    }
  }
}

function relMouseCoords(e) {
  if (e.type !== "touchstart") {
    e.preventDefault();
  }
  if (typeof this.canvas === "undefined") {
    return {x: 0, y: 0};
  }
  var currentElement = this.canvas;
  var totalOffsetX = 0;
  var totalOffsetY = 0;
  var canvasX = 0;
  var canvasY = 0;

  do {
    totalOffsetX += currentElement.offsetLeft;
    totalOffsetY += currentElement.offsetTop;
  }
  while (currentElement = currentElement.offsetParent);

  canvasX = (e.pageX || (e.touches && e.touches[0] && e.touches[0].pageX) || (this.cached_coords.x + totalOffsetX)) - totalOffsetX;
  canvasY = (e.pageY || (e.touches && e.touches[0] && e.touches[0].pageY) || (this.cached_coords.y + totalOffsetY)) - totalOffsetY;

  return {x: canvasX / GU, y: canvasY / GU}
}

if (window.navigator.msPointerEnabled) {
  document.addEventListener("MSPointerDown", handleEvent);
  document.addEventListener("MSPointerMove", function(e) {
    e.preventDefault();
    e.stopPropagation();
    handleEvent(e);
    return false;
  });
} else {
  document.addEventListener('touchstart', handleEvent);
  document.addEventListener('click', handleEvent);
  document.addEventListener("mousemove", handleEvent);
  document.addEventListener('touchmove', function(e) {
    e.preventDefault();
    e.stopPropagation();
    handleEvent(e);
    return false;
  });
}

function handleEvent(e) {
  e.preventDefault();
  var position = relMouseCoords(e);
  MOUSE.x = position.x;
  MOUSE.y = position.y;
  var eventType = (e.type === "mousemove" || e.type === "touchmove" || e.type === "pointermove" ? "hover" : "click");
  var clickables;
  if (typeof sm === "undefined") {
    return;
  } else if (typeof sm.activeState.gameMenuWindow !== "undefined" && sm.activeState.gameMenuWindow.visible) {
    clickables = sm.activeState.gameMenuWindow.buttons;
  } else {
    clickables = sm.activeState.elements;
  }
  var coordX, coordY, sizeX, sizeY;
  var hoverOverClickable = false;
  for (var i = 0; i < clickables.length; i++) {
    coordX = clickables[i][1].x;
    coordY = clickables[i][1].y;
    sizeX = clickables[i][1].w;
    sizeY = clickables[i][1].h;
    if (MOUSE.x >= coordX && MOUSE.x <= coordX + sizeX && MOUSE.y >= coordY && MOUSE.y <= coordY + sizeY) {
      if (eventType === "click") {
        clickables[i][0](clickables[i].slice(2));
      } else if (eventType === "hover") {
        hoverOverClickable = true;
      }
      break;
    }
  }
  clickables && clickables[i] && clickables[i][1].hover && clickables[i][1].hover();
  $("body").css('cursor', hoverOverClickable ? "pointer" : "auto");
}

window.addEventListener('resize', resize);

/* global mixin for position/size-objects that do AABB collision with another posititon/size-object */
function contains(obj) {
  return obj.position.x < this.position.x + this.size.w &&
    obj.position.x + obj.size.w > this.position.x &&
    obj.position.y < this.position.y + this.size.h &&
    obj.position.y + obj.size.h > this.position.y;
}

// Array Remove - By John Resig (MIT Licensed)
Array.remove = function(array, from, to) {
  var rest = array.slice((to || from) + 1 || array.length);
  array.length = from < 0 ? array.length + from : from;
  return array.push.apply(array, rest);
}

function highResolution() {
  var pixelRatio = 1;
  if (window.devicePixelRatio) {
    pixelRatio = window.devicePixelRatio;
  }
  return pixelRatio * $(window).width() > 1440 && pixelRatio * $(window).height() > 810;
}
