const assert = require("assert");
const boot = require("@colyseus/testing").boot;

const appConfig = require("../src/app.config");

describe("testing your Colyseus app", () => {
  let colyseus;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => {
    await colyseus.cleanup();
    /* @colyseus:test:setup */
  });

  it("moves the player the server's way", async () => {
    const room = await colyseus.createRoom("my_room", {});
    const client1 = await colyseus.connectTo(room);

    const player = room.state.players.get(client1.sessionId);
    assert.ok(player, "a Player is created on join");

    client1.send("move", { x: 1, y: 0 });
    await room.waitForMessage("move");
    await room.waitForNextTimestep();

    assert.ok(player.x > 100, "the server integrated the movement intent");
    assert.strictEqual(player.y, 100, "no intent on the y axis, no movement");
  });
});
