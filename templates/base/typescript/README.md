# Welcome to Colyseus!

This project was created with [⚔️ `create-colyseus-app`](https://github.com/colyseus/create-colyseus-app/).

[Documentation](https://docs.colyseus.io/)

## :crossed_swords: Usage

```
npm start
```

Then open http://localhost:2567 for the playground, or /monitor for the monitor.

## Structure

- `{{app-prefix}}src/index.ts`: entry point — leave it alone if you plan to deploy to Colyseus Cloud
- `{{app-prefix}}src/app.config.ts`: server configuration — rooms, HTTP routes, express middleware
- `{{app-prefix}}src/rooms/MyRoom.ts`: your room handler
- `{{app-prefix}}src/rooms/schema/MyRoomState.ts`: the state synchronized to every client in the room
- `{{app-prefix}}test/MyRoom.test.ts`: boots the real server and connects a real client
- `{{app-prefix}}loadtest/example.ts`: scriptable client for `npm run loadtest`
- `{{app-prefix}}ecosystem.config.cjs`: pm2 configuration, used when deploying to Colyseus Cloud

## Scripts

- `npm start`: run the server in watch mode (`tsx watch src/index.ts`)
- `npm test`: run the mocha test suite
- `npm run build`: compile to `build/`
- `npm run loadtest`: connect N simulated clients with [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/)

