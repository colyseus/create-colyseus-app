import { Room, Client, CloseCode, Delayed } from "colyseus";
import { MyRoomState, Player } from "./schema/MyRoomState.js";

/* @colyseus:room:imports */

/** How long a player has to act before their turn is skipped. */
const TURN_DURATION = 15_000;

export class MyRoom extends Room<{ state: MyRoomState }> {
  maxClients = 2;
  state = new MyRoomState();

  private turnTimeout?: Delayed;

  /* @colyseus:room:fields */

  messages = {
    /**
     * Ignored unless it is the sender's turn — turn order is the server's to
     * enforce, never the client's to claim.
     */
    play: (client: Client, message: any) => {
      if (this.state.currentTurn !== client.sessionId) { return; }

      const player = this.state.players.get(client.sessionId);
      if (!player) { return; }

      player.score++;
      this.nextTurn();
    },
    /* @colyseus:room:messages */
  };

  onCreate(options: any) {
    /* @colyseus:room:onCreate */
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
    this.state.players.set(client.sessionId, new Player());

    if (this.state.players.size === this.maxClients) {
      this.lock(); // full: stop the matchmaker from sending anyone else
      this.nextTurn();
    }
    /* @colyseus:room:onJoin */
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);
    const wasTheirTurn = this.state.currentTurn === client.sessionId;

    this.state.players.delete(client.sessionId);
    if (wasTheirTurn) { this.nextTurn(); }
    /* @colyseus:room:onLeave */
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  /** Hand the turn to the next player and restart the deadline. */
  nextTurn() {
    this.turnTimeout?.clear();

    const sessionIds = [...this.state.players.keys()];
    if (sessionIds.length === 0) {
      this.state.currentTurn = "";
      return;
    }

    // indexOf("") is -1, so the very first turn lands on sessionIds[0].
    const previous = sessionIds.indexOf(this.state.currentTurn);
    this.state.currentTurn = sessionIds[(previous + 1) % sessionIds.length];
    this.state.turnCount++;
    this.state.turnDeadline = this.clock.currentTime + TURN_DURATION;

    this.turnTimeout = this.clock.setTimeout(() => this.nextTurn(), TURN_DURATION);
  }

  /* @colyseus:room:methods */
}
