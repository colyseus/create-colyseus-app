const config = require("@colyseus/tools").default;
const { monitor } = require("@colyseus/monitor");

/**
 * Import your Room files
 */
const { MyRoom } = require("./rooms/MyRoom");

module.exports = config({
    getId: () => "Your Colyseus App",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/colyseus/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/colyseus", monitor());
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }

});
