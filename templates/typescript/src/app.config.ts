import http from "http";
import express from "express";
import {
    defineServer,
    defineRoom,
    monitor,
    playground,
    createRouter,
    createEndpoint,
    WebSocketTransport,
} from "colyseus";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom.js";

const app = express();
const server = http.createServer(app);

/**
 * Bind your custom express routes here:
 * Read more: https://expressjs.com/en/starter/basic-routing.html
 */
app.get("/hi", (req, res) => {
    res.send("It's time to kick ass and chew bubblegum!");
});

/**
 * Use @colyseus/monitor
 * It is recommended to protect this route with a password
 * Read more: https://docs.colyseus.io/tools/monitoring/#restrict-access-to-the-panel-using-a-password
 */
app.use("/monitor", monitor());

/**
 * Use @colyseus/playground
 * (It is not recommended to expose this route in a production environment)
 */
if (process.env.NODE_ENV !== "production") {
    app.use("/", playground());
}

const gameServer = defineServer({
    /**
     * Define your room handlers:
     */
    rooms: {
        my_room: defineRoom(MyRoom)
    },

    transport: new WebSocketTransport({
        server: server,
    }),

    /**
     * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
     * 
     * Usage from SDK: 
     *   client.http.{get, post, put, delete}("/path", {})
     * 
     */
    routes: createRouter({
        api_hello: createEndpoint("/api/hello", { method: "GET", }, async (ctx) => {
            return { message: "Hello World" }
        })
    }),

});

export default gameServer;