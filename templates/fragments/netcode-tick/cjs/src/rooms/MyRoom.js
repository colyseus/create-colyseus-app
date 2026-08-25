const colyseus = require("colyseus");
const { MyRoomState, Player } = require("./schema/MyRoomState");

/* @colyseus:room:imports */

/** Movement speed, in units per second. */
const SPEED = 200;

const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, value || 0));

class MyRoom extends colyseus.Room {
  maxClients = 4;
  state = new MyRoomState();

  /* @colyseus:room:fields */

  messages = {
    /**
     * Clients send intent, never a position — otherwise anyone could teleport
     * by editing the payload.
     */
    move: (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) { return; }

      player.inputX = clamp(message.x, -1, 1);
      player.inputY = clamp(message.y, -1, 1);
    },
    /* @colyseus:room:messages */
  };

  onCreate(options) {
    // `deltaTime` is the MEASURED gap since the last tick, in milliseconds.
    this.setTimestep((deltaTime) => this.update(deltaTime / 1000));
    /* @colyseus:room:onCreate */
  }

  onJoin(client, options) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player({ x: 100, y: 100 }));
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

  /** @param dt seconds since the previous tick. */
  update(dt) {
    for (const [, player] of this.state.players) {
      player.x += player.inputX * SPEED * dt;
      player.y += player.inputY * SPEED * dt;
    }
  }

  /* @colyseus:room:methods */
}

exports.MyRoom = MyRoom;
