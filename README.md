# `create-colyseus-app`

An npm init template for kick starting a Colyseus project in TypeScript.

## :crossed_swords: Usage

```
npm init colyseus-app
```

## Install dependencies

```
npm install --global lix
lix download
```

## Structure

- `Main.hx`: main entry point, register an empty room handler
- `MyRoom.ts`: an empty room handler for you to implement your logic
- `loadtest/example.js`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `node Main.js`
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
    - `dependencies`:
        - `colyseus`
    - `devDependencies`
        - `lix`
        - `@colyseus/loadtest`
- `tsconfig.json`: TypeScript configuration file


## License

MIT
