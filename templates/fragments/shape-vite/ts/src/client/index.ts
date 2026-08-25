import { ColyseusSDK } from "@colyseus/sdk";
import type { default as server } from "../app.config.js";

const statusEl = document.getElementById("status")!;
const stateEl = document.getElementById("state")!;

// `typeof server` types the room names, message types and HTTP routes end to
// end — a typo below is a compile error rather than a runtime one.
const client = new ColyseusSDK<typeof server>(
  `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`
);

async function main() {
  const hello = await client.http.get("/api/hello");
  console.log("/api/hello →", hello.data?.message);

  const room = await client.joinOrCreate("my_room");
  statusEl.textContent = `Connected as ${room.sessionId}`;

  // Whole-state dump: enough to see synchronization working. Swap it for
  // Callbacks.get(room) once you care about individual fields.
  room.onStateChange((state) => {
    stateEl.textContent = JSON.stringify(state.toJSON(), null, 2);
  });

  room.onLeave(() => {
    statusEl.textContent = "Disconnected";
  });
}

main().catch((e) => {
  console.error(e);
  statusEl.textContent = "Could not connect";
});
