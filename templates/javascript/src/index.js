/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */
const { listen } = require("@colyseus/tools");

// Import arena config
const app = require("./app.config");

// Create and listen on 2567 (or PORT environment variable.)
listen(app);
