### Server tick

`MyRoom` runs a game loop via `setTimestep()`, which fires on a wall-clock
interval and hands you the *measured* delta in milliseconds. Clients send
movement intent (`-1..1` per axis); the server integrates it and owns every
position.

`setTimestep` is the simple loop. If you later add client-side prediction, switch
to `setFixedTimestep()` — it advances a constant `dt` through an accumulator, and
only a constant `dt` replays deterministically on the client.

- https://docs.colyseus.io/room#game-loop
