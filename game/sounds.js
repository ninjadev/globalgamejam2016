var sounds = {
  byName: {
    'player_hit.mp3': '0',
    'shield_hit.mp3': '1',
    'bullet_fired.mp3': '2',
    'bullet_hit_wall.mp3': '3',
    'capture_point_taken_by_light.mp3': '4',
    'capture_point_taken_by_dark.mp3': '5',
    'dark_capture_point_lost.mp3': '6',
    'light_capture_point_lost.mp3': '7',
    'taking_over_capture_point.mp3': '8',
    'game_lost.mp3': '9',
    'game_won.mp3': '10'
  },
  byId: {}
};
for (var soundName in sounds.byName) {
  if (sounds.byName.hasOwnProperty(soundName)) {
    sounds.byId[sounds.byName[soundName]] = soundName;
  }
}
module.exports = SOUNDS = sounds;
