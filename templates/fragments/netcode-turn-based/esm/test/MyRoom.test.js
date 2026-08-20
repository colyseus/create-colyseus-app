import assert from "assert";
import { boot } from "@colyseus/testing";

import appConfig from "../src/app.config.js";

describe("testing your Colyseus app", () => {
  let colyseus;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => {
    await colyseus.cleanup();
    /* @colyseus:test:setup */
  });

  it("only lets the current player act", async () => {
    const room = await colyseus.createRoom("my_room", {});
    const client1 = await colyseus.connectTo(room);
    const client2 = await colyseus.connectTo(room);

    assert.strictEqual(room.state.currentTurn, client1.sessionId, "first joiner starts");

    // out of turn: ignored
    client2.send("play", {});
    await room.waitForMessage("play");
    assert.strictEqual(room.state.players.get(client2.sessionId).score, 0);
    assert.strictEqual(room.state.currentTurn, client1.sessionId);

    // in turn: counted, and the turn passes on
    client1.send("play", {});
    await room.waitForMessage("play");
    assert.strictEqual(room.state.players.get(client1.sessionId).score, 1);
    assert.strictEqual(room.state.currentTurn, client2.sessionId);
  });
});
