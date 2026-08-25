### Database

`@colyseus/database` gives you one typed connection behind `db.auth`, `db.saves`,
`db.leaderboards`, `db.configs` and friends, and `DatabaseDriver` reuses it for
matchmaking so there is no separate Redis to run.

The dialect is inferred from `DATABASE_URL`. `{{app-prefix}}.env.development` points at a local
SQLite file (`colyseus.db`, already gitignored); set `{{app-prefix}}.env.production` to a
`postgres://…` URL and `npm install postgres` before deploying — an empty value
silently falls back to SQLite, which is not what you want on a server that
scales past one process.

Migrations run at boot in `"auto"` mode: missing tables and columns are created.
Switch to `{ files: "./drizzle" }` once the schema matters.

Import `db` from `{{app-prefix}}src/app.config.ts` inside your rooms:

```ts
import { db } from "../app.config.js";
```

- https://docs.colyseus.io/database
