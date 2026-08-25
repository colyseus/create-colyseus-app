### OAuth ({{oauth-provider}})

`{{app-prefix}}src/config/auth.ts` registers {{oauth-provider}} as an OAuth provider. Fill
`OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET` in `{{app-prefix}}.env.development` with the
credentials from your {{oauth-provider}} application, and register
`http://localhost:2567/auth/provider/{{oauth-provider}}/callback` as an
authorized redirect URL.

`SESSION_SECRET` signs the OAuth state cookie — rotating it invalidates
in-flight logins, nothing more.

- https://docs.colyseus.io/auth/module
