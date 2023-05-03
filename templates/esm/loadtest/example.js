import { Client } from "colyseus.js";
import { cli } from "@colyseus/loadtest";

export async function main(options) {
    const client = new Client(options.endpoint);
    const room = await client.joinOrCreate(options.roomName, {
        // your join options here...
    });

    console.log("joined successfully!");

    room.onMessage("message-type", (payload) => {
        // logic
    });

    room.onStateChange((state) => {
        console.log("state change:", state);
    });

    room.onLeave((code) => {
        console.log("left");
    });
}

cli(main);
