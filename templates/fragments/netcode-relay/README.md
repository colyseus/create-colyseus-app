### Relay

Clients send their own transform and the server copies it into the state. There
is no game loop and no validation, so it is the cheapest thing that syncs — and
the easiest to cheat at, since a modified client can put itself anywhere.

Use it for co-op, sandboxes and prototypes. The moment a player can *lose*
something by another player lying, move the simulation onto the server (a
`setTimestep` loop over intent messages) instead.

- https://docs.colyseus.io/state
