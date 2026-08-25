### Idle kick

`IdleKickPlugin` disconnects clients that have not sent a message in 60 seconds.
Any inbound frame — including the SDK's keepalive pings — counts as activity, so
raise `timeoutMs` rather than expecting it to detect an idle-but-connected tab.

- https://docs.colyseus.io/room/plugins
