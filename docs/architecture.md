# SubSave architecture

## Current foundation

SubSave is a browser application built with React and JavaScript using Vite.
`index.html` loads `src/main.jsx`, which mounts `App` inside React Strict Mode.
`src/App.jsx` renders the dashboard and account UI; `src/index.css` supplies its
styles. Vite serves the app during development and builds static assets into
`dist/` for production. Oxlint checks the JavaScript and JSX source.

The browser currently runs without an HTTP API or server authentication. The
dashboard uses shared sample subscriptions and supports additions in React state. Google Fonts
provides DM Sans and Bricolage Grotesque, with system fallbacks when unavailable.
No environment variables are required to start the app.

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

## Dashboard UI

`src/dashboard/Dashboard.jsx` adapts the supplied HTML mockup to the app's React
state and existing account/subscription forms. `dashboard.css` handles the
responsive cards, sidebar, category chart, and timeline. `dashboardModel.js`
calculates summaries without mutating the subscription records:

- Yearly costs are divided by 12 for monthly expenses and category totals.
- The annual estimate is 12 times normalized monthly spending.
- Renewal dates use local calendar days and the current date, not a fixed preview
  date. Past dates remain overdue; the next renewal and timeline include today
  and future dates only. No billing dates are automatically advanced.
- Badges are red for overdue dates and renewals within three days, amber for
  four to seven days, and green for later renewals. Text labels accompany color.
- The insight shows the largest subscription's actual monthly spending share;
  no historical comparison or speculative savings are fabricated.

Add and edit share the form and icon upload in App. Adding, editing, and deleting
a record update the in-memory list and recalculate the dashboard. The form and
MySQL store share validation for subscription fields. `tests/dashboard.test.js`
covers dates, sorting, and totals.

## Subscription data flow

DATA-03 defines the shared record and MySQL schema. The subscription store scopes
all queries to an account ID supplied by the server. AUTH-01 will establish that
identity in a server session, DATA-01 will connect saved subscription operations,
and APP-03 will load the account’s records into the dashboard. See the
[subscription data contract and migration instructions](subscription-data.md).
