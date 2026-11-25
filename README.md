# SubSave

SubSave is a React subscription expense tracker for people who want to keep
recurring monthly costs and upcoming billing dates in one place.

The app includes the Material UI dashboard layout with sample subscriptions
and browser-based account features for [issue #7](https://github.com/mics26/SubSave/issues/7).
You can register, log in and out, edit your profile and login details, and try
a simulated password recovery flow. Account details and login state survive
refreshes using browser local storage. You can add, edit, and delete monthly or
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
- Browser local storage for demo accounts. DATA-03 adds a MySQL schema and
  server-side subscription store for the upcoming account and persistence integration.

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

No environment variables, API keys, or `.env` file are needed to run the app.
The dashboard is available without logging in. `.env.example` explains future
configuration conventions.

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
