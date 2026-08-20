import { ColyseusSDK } from "@colyseus/sdk";
import type { default as server } from "@{{name}}/backend/app.config";

const statusEl = document.getElementById("status")!;
const stateEl = document.getElementById("state")!;

// The backend package is a *type-only* dependency here: `typeof server` checks
// room names, message types and HTTP routes at compile time, and nothing from
// the server ends up in the browser bundle.
const client = new ColyseusSDK<typeof server>("ws://localhost:2567");

async function main() {
  const hello = await client.http.get("/api/hello");
  console.log("/api/hello →", hello.data?.message);

  const room = await client.joinOrCreate("my_room");
  statusEl.textContent = `Connected as ${room.sessionId}`;

  room.onStateChange((state) => {
    stateEl.textContent = JSON.stringify(state.toJSON(), null, 2);
  });

  room.onLeave(() => {
    statusEl.textContent = "Disconnected";
  });
}

main().catch((e) => {
  console.error(e);
  statusEl.textContent = "Could not connect (is the backend running on :2567?)";
});
