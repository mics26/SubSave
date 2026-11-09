# SubSave architecture

## Current foundation

SubSave is a browser application built with React and JavaScript using Vite.
`index.html` loads `src/main.jsx`, which mounts `App` inside React Strict Mode.
`src/App.jsx` renders the dashboard and account UI; `src/index.css` supplies its
styles. Vite serves the app during development and builds static assets into
`dist/` for production. Oxlint checks the JavaScript and JSX source.

There are currently no network API calls, backend services, external fonts,
server authentication, or persisted subscription records. The dashboard uses
sample subscriptions. No environment variables are required to start the app.

## Demo accounts (issue #7)

`src/accounts/accountService.js` handles account validation, registration,
login/logout, profile changes, and simulated recovery. UI components in the same
directory use the dashboard's Material UI theme. App state reads the current
account on startup and listens for storage events to synchronize other tabs.

The versioned local-storage key `subsave.accounts.v1` contains account records
and the active account ID in a single JSON document. Passwords use PBKDF2-SHA256
with a random per-password salt and 100,000 iterations through Web Crypto
(requires localhost or HTTPS). Public account objects expose only ID, name,
and email. An email/password change requires the current password. Failed writes
are reported before the UI claims success; invalid saved data is not overwritten.

Recovery codes are intentionally displayed in the UI for this simulation;
nothing is emailed. A code lives in memory, expires after 10 minutes, and is
discarded after five wrong attempts, successful reset, or dialog closure. Reset
saves the new password hash and logs out so the user can try the new credentials.
Reloading ends an in-progress recovery flow. Local storage is user-editable, so
these flows demonstrate behavior and must not be treated as production security.

`npm test` runs the account behavior tests using Node's built-in test runner.
See [account verification](../tests/accounts.md) for manual browser checks.

## Planned dashboard layout

The existing dashboard plan is retained for APP-02:

- Monthly subscription expense overview.
- Subscription cards displaying active services.
- Upcoming renewal date information.
- Controls for adding, editing, and deleting subscriptions.

The project proposal also calls for red subscription cards as renewal dates
approach. The warning threshold must be agreed before that logic is implemented.

## Planned data flow

Future subscription forms will pass changes to React state, and the dashboard
will render that state through components. Browser local storage is planned
under DATA-01 so records can survive a refresh. These are design intentions;
APP-01 does not implement them. Define the subscription model and date/currency
rules in the relevant feature issues before adding persistence or calculations.

Keep components and behavior tests near the features as they are introduced.
Avoid adding routing, a state management library, or server infrastructure until
a feature needs it.
