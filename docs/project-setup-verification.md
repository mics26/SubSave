# APP-01 verification record

Issue: https://github.com/mics26/SubSave/issues/1

## Implementation scope

The setup branch adds the React application entry point, Vite scripts, locked
dependencies, a startup page, and documentation for installation, requirements,
architecture, team roles, and contribution/review steps. The existing `docs/`
and `tests/` folders are retained, and `src/` contains the runnable foundation.
No dashboard or subscription feature is claimed as complete.

## Local verification

Checked by Codex on October 29, 2026, on this Windows computer, using Node.js
24.13.0 and npm 11.6.2. These results verify this environment, not each teammate's
computer or an independent peer review.

| Check | Result |
| --- | --- |
| Install with `npm install` | Passed; lockfile generated; 0 known vulnerabilities reported |
| Fresh source copy without dependencies/build output, then `npm ci` | Passed; 24 packages installed from the lockfile |
| `npm run lint` in the fresh copy | Passed |
| `npm run build` in the fresh copy | Passed with Vite 8.3.5 |
| Development app in Edge | Passed: React mounted; title, heading, and startup message present |
| Production preview in Edge | Passed: built app mounted with the same content |
| Browser refresh in both modes | Passed |
| Mobile width of 320px in both modes | Passed: heading visible and no horizontal overflow |
| Browser console, runtime, and failed network requests in both modes | No errors observed |
| Desktop and mobile screenshots | Visually checked; text readable and no overlap observed |
| Git ignore checks | `node_modules/`, `dist/`, and `.env` are ignored |

Automated browser checks used a separate temporary Edge session. The fresh
source-copy check validates the checked-in dependency declarations and lockfile;
it does not substitute for another person cloning with their own GitHub account.

## Independent confirmations still required

| Check | Responsible person | Status |
| --- | --- | --- |
| Owner clones and runs the app using the README | Michael S. Galozo | Pending personal confirmation |
| Reviewer independently clones, runs, and reviews the changes | Jose Ely P. Perez | Pending |
| Third member confirms access and local setup | France Loyd P. Tesaluna | Pending |

Each person should record their own result using [the setup checklist](../tests/README.md).
Do not mark another person's confirmation complete without their evidence.

## Completion gate

- [x] Local installation, lint, production build, and browser checks pass.
- [ ] Team members confirm repository access and local startup.
- [ ] Jose reviews the setup changes and findings are resolved.
- [ ] Review and verification links are added to the GitHub issue and Trello card.
- [ ] After review and merging, close APP-01 and update its Trello status.

Keep issue #1 open until the applicable confirmations and review are complete.
