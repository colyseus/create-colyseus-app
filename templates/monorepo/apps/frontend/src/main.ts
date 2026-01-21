import { ColyseusSDK, Callbacks } from "@colyseus/sdk";
import type { default as server } from "@myapp/backend/app.config";

const statusEl = document.getElementById("status")!;
const playersEl = document.getElementById("players")!;

async function main() {
    const client = new ColyseusSDK<typeof server>("ws://localhost:2567");

    // using the API routes
    client.http.get("/api/hello").then((response) => {
        console.log("/api/hello response:", response.data?.message);
    });

    // @ts-expect-error
    client.http.get("/non-existing-route")
        .then((response) => {})
        .catch((error) => {
            console.log("/non-existing-route error:", error.code);
        });

    statusEl.textContent = "Connecting...";

    try {
        const room = await client.joinOrCreate("my_room")
        const callbacks = Callbacks.get(room);

        statusEl.textContent = `Connected (${room.sessionId})`;
        statusEl.className = "connected";

        // Listen for players joining
        callbacks.onAdd("players", (player, sessionId) => {
            const li = document.createElement("li");
            li.id = `player-${sessionId}`;
            li.textContent = sessionId;
            playersEl.appendChild(li);
        });

        // Listen for players leaving
        callbacks.onRemove("players", (player, sessionId) => {
            const li = document.getElementById(`player-${sessionId}`);
            li?.remove();
        });

        room.onLeave(() => {
            statusEl.textContent = "Disconnected";
            statusEl.className = "disconnected";
            playersEl.innerHTML = "";
        });

    } catch (e) {
        console.error("Could not connect:", e);
        statusEl.textContent = "Connection failed";
        statusEl.className = "disconnected";
    }
}

main();
