const http = require('http');
const express = require('express');
const colyseus = require('colyseus');
const monitor = require("@colyseus/monitor").monitor;

const MyRoom = require('./MyRoom').MyRoom;

const port = process.env.PORT || 2567;
const app = express()

const server = http.createServer(app);
const gameServer = new colyseus.Server({ server });

// register your room handlers
gameServer.register('my_room', MyRoom);

// Register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor(gameServer));

gameServer.listen(port);
console.log(`Listening on ws://localhost:${ port }`)
