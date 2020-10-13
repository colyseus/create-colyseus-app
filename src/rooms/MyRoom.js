const colyseus = require('colyseus');
const MyRoomState = require('./schema/MyRoomState').MyRoomState;

exports.MyRoom = class extends colyseus.Room {

  onCreate (options) {
    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message.
      //
    });

  }

  onJoin (client, options) {
  }

  onLeave (client, consented) {
  }

  onDispose() {
  }

}
