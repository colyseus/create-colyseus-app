import assert from "assert";
import { ColyseusTestServer, boot } from "@colyseus/testing";

import appConfig from "../src/app.config.js";
import { MyRoomState } from "../src/rooms/schema/MyRoomState.js";

describe("testing your Colyseus app", () => {
  let colyseus: ColyseusTestServer<typeof appConfig>;

  before(async () => colyseus = await boot(appConfig));
  after(async () => colyseus.shutdown());

  beforeEach(async () => {
    await colyseus.cleanup();
    /* @colyseus:test:setup */
  });

  it("relays a client's transform to the room state", async () => {
    const room = await colyseus.createRoom<MyRoomState>("my_room", {});
    const client1 = await colyseus.connectTo(room);

    client1.send("update", { x: 10, y: 20, angle: 1.5 });
    await room.waitForMessage("update");

    const player = room.state.players.get(client1.sessionId);
    assert.strictEqual(player.x, 10);
    assert.strictEqual(player.y, 20);
  });
});
