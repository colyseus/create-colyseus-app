### Authentication

`@colyseus/auth` mounts its routes under `auth.prefix`, giving you anonymous
sign-in and email/password registration without writing endpoints. The room's
static `onAuth` verifies the issued JWT automatically.

`{{app-prefix}}src/config/auth.{{src-ext}}` holds the storage callbacks. It ships with an **in-memory
array** so the flow works on the first run — replace `onFindUserByEmail`,
`onRegisterWithEmailAndPassword` and `onRegisterAnonymously` with real queries
before you deploy anything.

`JWT_SECRET` and `SESSION_SECRET` were generated into `{{app-prefix}}.env.development` and
`{{app-prefix}}.env.production`. Rotating `JWT_SECRET` logs everyone out; keep both out of
version control.

- https://docs.colyseus.io/auth/module
