const Colyseus = require("colyseus.js");
const loadtest = require("@colyseus/loadtest");

export async function main(options) {
    const client = new Colyseus.Client(options.endpoint);
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

loadtest.cli(main);
