/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting, you can see "Raw usage" from the documentation.
 * 
 * See: https://docs.colyseus.io/server
 */
const { listen } = require("@colyseus/tools");

// Import Colyseus config
const app = require("./app.config");

// Create and listen on 2567 (or PORT environment variable.)
listen(app);
