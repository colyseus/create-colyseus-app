import { Room } from "colyseus";
import { MyRoomState } from './schema/MyRoomState.js';

class MyRoom extends Room {

  onCreate (options) {
    this.setState(new MyRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message.
      //
    });

  }

  onJoin (client, options) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client, consented) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}

export { MyRoom }
