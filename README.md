# `create-colyseus-app`

The scaffolding CLI for [Colyseus](https://colyseus.io/). It asks a few questions
and assembles a project from composable fragments, so what you get already
contains the boilerplate you'd otherwise copy out of a demo.

## :crossed_swords: Usage

```bash
npm create colyseus-app@latest ./my-server
```

Every question can also be answered on the command line, so the same command
works in a terminal and in a script:

```bash
npm create colyseus-app@latest my-game -- --typescript --preset realtime-action --yes

npm create colyseus-app@latest my-game -- --ts --layout vite --netcode fixed \
  --matchmaking lobby,reconnection --auth module --database colyseus --yes
```

Anything you don't pass is asked interactively. With `--yes` — or when stdin is
not a TTY, as in CI — the defaults are used and nothing prompts. Run
`npx create-colyseus-app@latest --help` for the full list, or `--list` for the
same thing as JSON.

> Note the `--` separator: `npm create` needs it to forward flags. `npx` and
> `bun create` don't.

### What you can choose

| Flag | Values |
|---|---|
| `--language` | `typescript` · `esm` · `cjs` · `haxe` (shorthand: `--ts`, `--esm`, `--cjs`, `--haxe`) |
| `--preset` | `minimal` · `realtime-action` · `turn-based` · `custom` |
| `--layout` | `server` · `vite` (client + server in one project) · `monorepo` |
| `--netcode` | `none` · `fixed` (authoritative tick + client prediction) · `tick` · `turn-based` · `relay` |
| `--matchmaking` | `lobby` · `filterby` · `reconnection` · `idle-kick` (comma-separated) |
| `--auth` | `none` · `onauth` · `module` · `oauth` |
| `--database` | `none` · `colyseus` |

Some choices are TypeScript-only — the CLI says so instead of generating
half-working JavaScript.

## How it works

```
templates/
  base/{typescript,esm,cjs}/   minimal server, carrying named anchors
  haxe/                        copied verbatim
  fragments/<id>/
    manifest.json              files to add/move/remove, deps, scripts, env
    ts/ esm/ cjs/              per-language overlay trees
    ts/_snippets/              code spliced into anchors
    README.md                  appended to the generated README
  presets/*.json               pre-filled answer sets
lib/
  options.js                   AXES — the single source of truth
  args.js prompts.js resolve.js   flags, prompts and precedence, all from AXES
  fragments.js compose.js merge.js
```

A run copies `base/<language>`, overlays each fragment the answers imply, then
splices the fragments' snippets into the anchors the base files carry:

```ts
const server = defineServer({
  rooms: {
    my_room: defineRoom(MyRoom)/* @colyseus:server:my-room-chain */,
    /* @colyseus:server:rooms */
  },
```

Anchors are named globally rather than per file, so a fragment that contributes
code doesn't need to know which file it lands in — which is what lets the Vite
and monorepo layouts relocate the server tree without every other fragment
caring. Markers with no contributions are dropped, so generated projects carry
no scaffolding residue.

An anchor alone on its line takes a block of code, indented to match. One that
shares its line with real code is spliced **in place**, so a fragment can extend
an expression rather than the base having to hoist it into a variable to be
extendable — `--matchmaking lobby,filterby` turns the line above into:

```ts
    my_room: defineRoom(MyRoom).enableRealtimeListing().filterBy(["mode"]),
    lobby: defineRoom(LobbyRoom),
```

Fragments also deep-merge `package.json`, `tsconfig.json`, `.env.*` and
`.gitignore`; `"@secret"` in a manifest's `env` becomes a freshly generated
value rather than a placeholder that's identical on every install.

### Adding a question

Add an entry to `AXES` in `lib/options.js` and a fragment directory named after
the answer (`netcode-<value>`, `auth-<value>`, …). The prompt, the flag,
`--help`, `--list` and the test matrix all follow from that one entry.

## Development

```bash
npm test          # generate the whole matrix, install, typecheck, run its tests
npm run test:quick   # generation + static checks only
node scripts/smoke.mjs --filter turn-based
```

The smoke run generates every preset and every single-axis variation with stdin
closed, so a question that fails to be answerable by flag shows up as a hang
rather than a silent pass.

## License

MIT
