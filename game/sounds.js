var sounds = {
  byName: {
    'gun-1.mp3': '0',
    'gun-2.mp3': '1',
    'gun-3.mp3': '2',
    'dark-ritual-complete.mp3': '3',
    'light-ritual-complete.mp3': '4',
    'game-over-light-wins.mp3': '5',
    'game-over-dark-wins.mp3': '6',
  },
  byId: {}
};
for (var soundName in sounds.byName) {
  if (sounds.byName.hasOwnProperty(soundName)) {
    sounds.byId[sounds.byName[soundName]] = soundName;
  }
}
module.exports = SOUNDS = sounds;
