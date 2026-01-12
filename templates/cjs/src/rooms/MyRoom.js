const colyseus = require('colyseus');
const { MyRoomState } = require('./schema/MyRoomState');

exports.MyRoom = class extends colyseus.Room {
  maxClients = 4;
  state = new MyRoomState();

  messages = {
    yourMessageType: (client, message) => {
      /**
       * Handle "yourMessageType" message.
       */
      console.log(client.sessionId, "sent a message:", message);
    }
  }

  onCreate (options) {
    /**
     * Called when a new room is created.
     */
  }

  onJoin (client, options) {
    /**
     * Called when a client joins the room.
     */
    console.log(client.sessionId, "joined!");
  }

  onLeave (client, code) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, "left!", code);
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log("room", this.roomId, "disposing...");
  }

}
