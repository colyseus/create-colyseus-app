const colyseus = require("colyseus");
const { MyRoomState } = require("./schema/MyRoomState");

/* @colyseus:room:imports */

class MyRoom extends colyseus.Room {
  maxClients = 4;
  state = new MyRoomState();

  /* @colyseus:room:fields */

  messages = {
    yourMessageType: (client, message) => {
      /**
       * Handle "yourMessageType" message.
       */
      console.log(client.sessionId, "sent a message:", message);
    },
    /* @colyseus:room:messages */
  };

  onCreate(options) {
    /**
     * Called when a new room is created.
     */
    /* @colyseus:room:onCreate */
  }

  onJoin(client, options) {
    /**
     * Called when a client joins the room.
     */
    console.log(client.sessionId, "joined!");
    /* @colyseus:room:onJoin */
  }

  onLeave(client, code) {
    /**
     * Called when a client leaves the room.
     */
    console.log(client.sessionId, "left!", code);
    /* @colyseus:room:onLeave */
  }

  onDispose() {
    /**
     * Called when the room is disposed.
     */
    console.log("room", this.roomId, "disposing...");
  }

  /* @colyseus:room:methods */
}

exports.MyRoom = MyRoom;
