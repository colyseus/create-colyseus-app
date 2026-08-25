### Client-side prediction

`src/client/index.ts` runs the same `stepEntity` the server runs. Every input is
applied locally the instant it is sent, so your own square responds with zero
latency; when the server's next patch acknowledges input *N*, the reconciler
rewinds to the authoritative state and replays inputs *N+1…* through that same
function.

One `predict.tick(now)` per frame drives everything, and it returns how many
fixed steps are due — that is the loop that decides how many inputs to send, so
input rate follows the simulation rate rather than your monitor's refresh rate.

Other players are not yours to predict, so they are interpolated (`mode: "lerp"`)
toward the latest snapshot instead — with `smoothMs: 65` keeping their rendered
velocity continuous at the cost of ~65 ms of extra display lag (lower it, or set
0, when currency matters more than smoothness). Read every position through
`predict.value(player, "x")`: it returns the predicted value for your own
entity and the interpolated one for everyone else.

- https://docs.colyseus.io/netcode/client-prediction
