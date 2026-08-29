# Changelog

## 0.18.1

- The generated app no longer mounts `@colyseus/monitor` in production. The panel can disconnect clients and edit room state, and it shipped unguarded, so a stock deploy exposed it publicly. It is now gated behind `NODE_ENV !== "production"` like the playground — to keep it in production, protect it with a password first ([docs](https://docs.colyseus.io/tools/monitoring#password-protection)). [#957](https://github.com/colyseus/colyseus/issues/957)
