# SubSave

SubSave is a React subscription expense tracker for people who want to keep
recurring monthly costs and upcoming billing dates in one place.

The app includes a Material UI dashboard and supports local demo accounts or
MySQL-backed accounts. Register, sign in, sign out, and edit your profile in both
modes. Demo accounts also include a simulated password recovery flow.
You can add, edit, and delete monthly or
yearly subscriptions with optional icons. The dashboard updates its category
spending chart, annual estimate, renewal timeline, and badges when records change.
Subscription changes live in memory until MySQL persistence is connected.

## Planned features

- Highlight subscription cards in red as their renewal dates approach.
- Save subscriptions per account in MySQL.

See [dashboard verification](tests/dashboard.md) for the UI refresh checks.

## Stack

- React with JavaScript and JSX.
- Vite for local development and production builds.
- Material UI and CSS for styling, npm for dependency management, and Oxlint for linting.
- Node.js API and MySQL 8.4 for server-backed accounts and sessions.
- Browser local storage for accounts in demo mode.

## Prerequisites

Install Git and Node.js 24 LTS, including npm 11 or newer.
The setup was checked with Node.js 24.13.0; `.nvmrc` records that version.
Check your installation with `git --version`, `node --version`, and `npm --version`.
Your GitHub account must have access to this private repository.

## Clone and run

```sh
git clone https://github.com/mics26/SubSave.git
cd SubSave
npm ci
npm run dev
```

Open the local address printed by Vite, usually `http://localhost:5173`.
You should see the SubSave dashboard. Press Ctrl+C in the terminal to stop it.

In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy
blocks `npm.ps1`. Changing the machine's execution policy is not required.

## Run with MySQL accounts

1. In MySQL Workbench, select the `subsave` schema and apply [migration 001](database/migrations/001_create_accounts_and_subscriptions.sql) and [migration 002](database/migrations/002_account_auth_and_sessions.sql). If 001 is already applied, run 002.
2. Copy `.env.example` to `.env`. Set `SUBSAVE_DATABASE_URL` to your MySQL connection for `subsave`. Use a database account with read/write access to the project tables and percent-encode special characters in the username or password. Keep `.env` local.
3. Run `npm run api` in one terminal and `npm run dev` in another. Open the URL Vite prints. Create a new server account, since your earlier demo accounts live in browser storage.

For a quick check, register, refresh to confirm the session is restored, sign
out, and sign back in. The optional `npm run test:auth` runs the same flow
against the disposable preview URL in `SUBSAVE_AUTH_TEST_URL`.

## Checks and production preview

```sh
npm run lint
npm test
npm run build
npm run preview
```

Open the preview address printed in the terminal, usually `http://localhost:4173`.
`npm run build` creates `dist/`; generated output and `node_modules/` are ignored
by Git. Preview is for checking the production build locally.

The app opens in demo mode without `.env`. With MySQL accounts enabled, Vite
forwards `/api` requests to the Node.js server in development and preview.
For an HTTPS deployment, serve the frontend and API on the same origin and
set `SUBSAVE_COOKIE_SECURE=true` on the server.

See the [subscription data contract](docs/subscription-data.md) to apply the
DATA-03 migration in MySQL Workbench and run the database integration test.

## Repository layout

```text
src/                 React entry point, dashboard, account components, and styles
tests/               Automated account tests and manual verification steps
docs/                Requirements, architecture, team roles, and review evidence
index.html           HTML entry point
vite.config.js       Vite React configuration
package.json         Scripts and dependencies
package-lock.json    Locked dependency versions; commit changes with package.json
```

## Team and workflow

Michael S. Galozo, Jose Ely P. Perez, and France Loyd P. Tesaluna are the project
team. See [team roles](docs/team-roles.md), [contribution guidelines](CONTRIBUTING.md),
and the [member contribution matrix](docs/member-contributions.md).

- [SubSave Project Development board](https://trello.com/b/6ac70be67109424626d92eb8)
  (team access required).
- [GitHub issues](https://github.com/mics26/SubSave/issues).
- [Requirements](docs/requirements.md) and [architecture](docs/architecture.md).
- [APP-01 verification and remaining sign-offs](docs/project-setup-verification.md).

APP-01 stays open until the reviewer verifies the changes and the team confirms
that they can clone and run the environment locally. Dashboard implementation
continues under [issue #2](https://github.com/mics26/SubSave/issues/2).
