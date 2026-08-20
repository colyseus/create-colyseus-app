### Monorepo

Two packages that deploy independently: `apps/backend` (the Colyseus server) and
`apps/frontend` (a Vite app). The frontend imports the backend's *types* — not
its code — so `client.joinOrCreate("my_room")` is checked against the real room
definitions while the two still ship separately.

```bash
npm start                      # backend, on :2567
npm run dev -w apps/frontend   # frontend, on :3000 (second terminal)
```

`workspaces` is declared with plain `*` ranges, so npm, pnpm and yarn all
install it; `pnpm-workspace.yaml` is there for pnpm's own resolver.

Pick this over the single Vite project when the two halves have different deploy
targets or release cadences. If they don't, the Vite layout is less to run.
