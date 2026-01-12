const config = require("@colyseus/tools").default;
const { defineRoom, createRouter, createEndpoint } = require("@colyseus/core");
const { monitor } = require("@colyseus/monitor");
const { playground } = require("@colyseus/playground");

/**
 * Import your Room files
 */
const { MyRoom } = require("./rooms/MyRoom");

module.exports = config({
    /**
     * Define your room handlers:
     */
    rooms: {
        my_room: defineRoom(MyRoom)
    },

    /**
     * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
     * 
     * Usage from SDK: 
     *   client.http.{get, post, put, delete}("/path", {})
     * 
     */
    routes: createRouter({
        hello: createEndpoint("/hello", { method: "GET", }, async (ctx) => {
            return { message: "Hello World" }
        })
    }),

    /**
     * Callback when gameServer instance is available.
     */
    initializeGameServer: (gameServer) => {
        gameServer.onShutdown(() => console.log("Shutting down..."));
    },

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    initializeExpress: (app) => {
        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor", monitor());
    },

    /**
     * Before before gameServer.listen() is called.
     */
    beforeListen: () => {
    }

});
