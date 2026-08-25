# `create-colyseus-app`

An npm init template for kick starting a Colyseus project in Haxe.

> **Note:** this template targets Colyseus **0.17**. The other templates have
> moved to 0.18 — Haxe follows once [`colyseus-hxjs`](https://github.com/serjek/colyseus-hxjs)
> (by @serjek) ships externs for the 0.18 API and `@colyseus/schema` 5.x.

## :crossed_swords: Usage

```
npm init colyseus-app
```

## How to compile and run

```
npm run compile
```

```
npm start
```

## Structure

- `Main.hx`: main entry point, register an empty room handler
- `MyRoom.hx`: an empty room handler for you to implement your logic
- `loadtest/example.js`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `node Main.js`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.js` script.
    - `dependencies`:
        - `colyseus`
    - `devDependencies`
        - `lix`
        - `@colyseus/loadtest`
- `tsconfig.json`: TypeScript configuration file


## License

MIT
