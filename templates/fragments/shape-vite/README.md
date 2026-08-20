### Single Vite project

Client, server and shared code live in one project on one port. `npm start`
runs Vite with the `colyseus/vite` plugin: it boots the server in-process and
hot-reloads your rooms when you edit them, so there is no second terminal and no
build step in development.

```
index.html
src/app.config.ts    server config (the plugin's `serverEntry`)
src/rooms/           your rooms
src/client/          browser code
```

`npm run build` produces both halves — `dist/client/` and `dist/server/server.mjs`.
`npm run build:client` skips the server, for deploying the client to a static
host while the server runs elsewhere.

Express runs *in front of* Vite in development, so `/` belongs to the client and
the playground moved to `/playground`. The direct `@colyseus/playground`
dependency floors the version at 0.18.3, which redirects the slash-less
`/playground` itself — older versions render it blank.

- https://docs.colyseus.io/server/vite
