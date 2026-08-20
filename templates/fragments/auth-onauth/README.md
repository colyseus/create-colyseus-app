### Room authentication

`MyRoom.onAuth()` runs at matchmaking time, before a seat is consumed and before
`onJoin()`. Throw to reject the join; whatever you return becomes `client.auth`.

The static form is used here because it does not need a room instance. Replace
the placeholder verification with whatever issues your tokens — a call to your
API, or `JWT.verify()` from `@colyseus/auth` if this server issued them.

- https://docs.colyseus.io/auth/room
