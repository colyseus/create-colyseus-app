const colyseus = require('colyseus');

exports.MyRoom = class extends colyseus.Room {
  onInit (options) {}
  onJoin (client, options) {}
  onMessage (client, message) {}
  onLeave (client, consented) {}
  onDispose() {}
}
