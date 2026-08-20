### Lobby room

A `LobbyRoom` is registered as `lobby`, and the sample room is chained with
`.enableRealtimeListing()` so the lobby receives create/update/dispose events for
it. Clients join the lobby to render a live room browser:

```ts
const lobby = await client.joinOrCreate("lobby");
lobby.onMessage("rooms", (rooms) => { /* full list on join */ });
lobby.onMessage("+", ([roomId, room]) => { /* added or updated */ });
lobby.onMessage("-", (roomId) => { /* removed */ });
```

- https://docs.colyseus.io/matchmaker/lobby
