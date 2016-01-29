function Player(name) {
  this.name = name;
  this.ensureName();
  console.log('Player name is', this.name);
}

Player.prototype.ensureName = function() {
  if (!this.name) {
    this.chooseRandomSillyName();
  }
};

Player.prototype.chooseRandomSillyName = function() {
  var firstName = ["Runny", "Buttercup", "Dinky", "Stinky", "Crusty",
    "Greasy", "Gidget", "Cheesypoof", "Lumpy", "Wacky", "Tiny", "Flunky",
    "Fluffy", "Zippy", "Doofus", "Gobsmacked", "Slimy", "Grimy", "Salamander",
    "Oily", "Burrito", "Bumpy", "Loopy", "Snotty", "Irving", "Egbert"];

  var lastName = ["Snicker", "Buffalo", "Gross", "Bubble", "Sheep",
    "Corset", "Toilet", "Lizard", "Waffle", "Kumquat", "Burger", "Chimp", "Liver",
    "Gorilla", "Rhino", "Emu", "Pizza", "Toad", "Gerbil", "Pickle", "Tofu",
    "Chicken", "Potato", "Hamster", "Lemur", "Vermin"];
  var firstNameIndex = Math.floor(Math.random() * firstName.length);
  var lastNameIndex = Math.floor(Math.random() * lastName.length);
  this.name = firstName[firstNameIndex] + " " + lastName[lastNameIndex];
};
