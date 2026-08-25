import { Room, CloseCode } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

/* @colyseus:room:imports */

export class MyRoom extends Room {
  maxClients = 8;
  state = new MyRoomState();

  /* @colyseus:room:fields */

  messages = {
    /**
     * Client-authoritative: whatever a client reports is what everyone else
     * sees. Nothing here validates the values — see this fragment's section in
     * the README before shipping it competitively.
     */
    update: (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) { return; }

      player.x = message.x;
      player.y = message.y;
      player.angle = message.angle;
    },
    /* @colyseus:room:messages */
  };

  onCreate(options) {
    /* @colyseus:room:onCreate */
  }

  onJoin(client, options) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());
    /* @colyseus:room:onJoin */
  }

  onLeave(client, code) {
    console.log(client.sessionId, "left!", code);
    this.state.players.delete(client.sessionId);
    /* @colyseus:room:onLeave */
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  /* @colyseus:room:methods */
}
