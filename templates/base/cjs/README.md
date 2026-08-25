# Welcome to Colyseus!

This project was created with [⚔️ `create-colyseus-app`](https://github.com/colyseus/create-colyseus-app/).

[Documentation](https://docs.colyseus.io/)

## :crossed_swords: Usage

```
npm start
```

Then open http://localhost:2567 for the playground, or /monitor for the monitor.

## Structure

- `{{app-prefix}}src/index.js`: entry point — leave it alone if you plan to deploy to Colyseus Cloud
- `{{app-prefix}}src/app.config.js`: server configuration — rooms, HTTP routes, express middleware
- `{{app-prefix}}src/rooms/MyRoom.js`: your room handler
- `{{app-prefix}}src/rooms/schema/MyRoomState.js`: the state synchronized to every client in the room
- `{{app-prefix}}test/MyRoom.test.js`: boots the real server and connects a real client
- `{{app-prefix}}loadtest/example.js`: scriptable client for `npm run loadtest`
- `{{app-prefix}}ecosystem.config.cjs`: pm2 configuration, used when deploying to Colyseus Cloud

## Scripts

- `npm start`: run the server in watch mode (`node --watch src/index.js`)
- `npm test`: run the mocha test suite
- `npm run build`: no build step — the sources run as-is
- `npm run loadtest`: connect N simulated clients with [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/)

