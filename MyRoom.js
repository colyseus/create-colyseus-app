const colyseus = require('colyseus');

exports.MyRoom = class extends colyseus.Room {

  onCreate (options) {

    this.onMessage("type", (client, message) => {
      // handle "type" message.
    });

  }

  onJoin (client, options) {
  }

  onLeave (client, consented) {
  }

  onDispose() {
  }

}
