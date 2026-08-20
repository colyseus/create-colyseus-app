import { Room, Client, CloseCode, type StepContext } from "colyseus";
import { MyRoomState, Player, MoveInput } from "./schema/MyRoomState.js";
import { stepEntity } from "../shared/movement.js";
import { TICK_RATE, ARENA_WIDTH, ARENA_HEIGHT } from "../shared/constants.js";

/* @colyseus:room:imports */

export class MyRoom extends Room<{ state: MyRoomState, input: MoveInput }> {
  maxClients = 8;
  state = new MyRoomState();

  /**
   * Per-client input buffer. `sanitize` clamps every field as it is decoded —
   * never trust the wire — and the buffer holds ~2s of inputs at this tick rate
   * so a burst after a stall still replays in order.
   */
  inputs = this.defineInput(MoveInput, {
    bufferMaxSize: 64,
    sanitize: { moveX: [-1, 1], moveY: [-1, 1] },
  });

  private joinCount = 0;

  /* @colyseus:room:fields */

  messages = {
    /* @colyseus:room:messages */
    // movement arrives through the input buffer above — register handlers here
    // only for things that are not inputs (chat, emotes, …).
  };

  onCreate(options: any) {
    this.setFixedTimestep((ctx) => this.step(ctx), TICK_RATE);
    /* @colyseus:room:onCreate */
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    // Deterministic spawn ring, so two players never start on top of each other.
    const angle = this.joinCount++ * 2.399963;
    this.state.players.set(client.sessionId, new Player({
      x: ARENA_WIDTH / 2 + Math.cos(angle) * 80,
      y: ARENA_HEIGHT / 2 + Math.sin(angle) * 80,
      vx: 0,
      vy: 0,
    }));
    /* @colyseus:room:onJoin */
  }

  onLeave(client: Client, code: CloseCode) {
    console.log(client.sessionId, "left!", code);
    this.state.players.delete(client.sessionId);
    /* @colyseus:room:onLeave */
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  /**
   * One shared `stepEntity` per received input, so the set the client predicted
   * is exactly the set the server applied. A client that sends nothing simply
   * does not move — an empty tick advances no one.
   */
  private step(ctx: StepContext) {
    for (const [sessionId, player] of this.state.players) {
      const channel = this.inputs.get(sessionId);
      if (!channel) { continue; }

      for (const input of channel) {
        stepEntity(player, input, ctx.dt);
      }
    }
  }

  /* @colyseus:room:methods */
}
