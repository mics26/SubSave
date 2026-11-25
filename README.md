# SubSave

Track subscriptions, spending, and renewal dates.

## Run locally

Requires Node.js 24 and npm 11+.

```sh
npm ci
npm run dev
```

Open the URL Vite prints.

For MySQL sign-in, apply the SQL files in `database/migrations/` to `subsave` in order. Copy `.env.example` to `.env`, set `SUBSAVE_DATABASE_URL`, and run `npm run api` in a second terminal.
