# SubSave

SubSave is a React subscription expense tracker for people who want to keep
recurring monthly costs and upcoming billing dates in one place.

This repository currently contains the runnable project foundation for
[APP-01 / issue #1](https://github.com/mics26/SubSave/issues/1).
The startup page is a placeholder. The dashboard and subscription features
are planned work and are not implemented yet.

## Planned features

- Add an active subscription, including its monthly cost and billing cycle.
- View active subscriptions, monthly expenses, and upcoming renewal dates.
- Highlight subscription cards in red as their renewal dates approach.
- Edit and delete subscriptions, and persist data locally in the browser.

## Stack

- React with JavaScript and JSX.
- Vite for local development and production builds.
- Plain CSS for styling, npm for dependency management, and Oxlint for linting.
- Browser local storage is planned; there is currently no backend or database.

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
You should see the SubSave startup page. Press Ctrl+C in the terminal to stop it.

To review APP-01 before it is merged, run
`git switch --track origin/feature/1-project-setup` after cloning and before `npm ci`.
If that branch is already available locally, use `git switch feature/1-project-setup`.

In Windows PowerShell, use `npm.cmd` instead of `npm` if script execution policy
blocks `npm.ps1`. Changing the machine's execution policy is not required.

## Checks and production preview

```sh
npm run lint
npm run build
npm run preview
```

Open the preview address printed in the terminal, usually `http://localhost:4173`.
`npm run build` creates `dist/`; generated output and `node_modules/` are ignored
by Git. Preview is for checking the production build locally.

No environment variables, account creation, API keys, or `.env` file are needed
to run the foundation. `.env.example` explains future configuration conventions.

## Repository layout

```text
src/                 React entry point, startup component, and styles
tests/               Manual setup verification steps
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
