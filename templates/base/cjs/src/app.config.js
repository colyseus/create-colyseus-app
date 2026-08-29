const {
  defineServer,
  defineRoom,
  monitor,
  playground,
  createRouter,
  createEndpoint,
} = require("colyseus");

/* @colyseus:server:imports */

/**
 * Import your Room files
 */
const { MyRoom } = require("./rooms/MyRoom");

/* @colyseus:server:before */

const server = defineServer({
  /* @colyseus:server:options */

  /**
   * Define your room handlers:
   */
  rooms: {
    my_room: defineRoom(MyRoom)/* @colyseus:server:my-room-chain */,
    /* @colyseus:server:rooms */
  },

  /**
   * Experimental: Define API routes. Built-in integration with the "playground" and SDK.
   *
   * Usage from SDK:
   *   client.http.get("/api/hello").then((response) => {})
   *
   */
  routes: createRouter({
    api_hello: createEndpoint("/api/hello", { method: "GET" }, async (ctx) => {
      return { message: "Hello World" };
    }),
    /* @colyseus:server:routes */
  }),

  /**
   * Bind your custom express routes here:
   * Read more: https://expressjs.com/en/starter/basic-routing.html
   */
  express: (app) => {
    /* @colyseus:server:express */

    app.get("/hi", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Use @colyseus/monitor
     * If you expose it in production, make sure to protect it with a password:
     * https://docs.colyseus.io/tools/monitoring#password-protection
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/monitor", monitor());
    }

    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */
    if (process.env.NODE_ENV !== "production") {
      app.use("/", playground());
    }
  }
});

module.exports = server;

/* @colyseus:server:exports */
