# SubSave architecture

## Current foundation

SubSave is a browser application built with React and JavaScript using Vite.
`index.html` loads `src/main.jsx`, which mounts `App` inside React Strict Mode.
`src/App.jsx` renders the dashboard and account UI; `src/index.css` supplies its
styles. Vite serves the app during development and builds static assets into
`dist/` for production. Oxlint checks the JavaScript and JSX source.

The dashboard loads saved subscriptions for the active account and clears the
list when the account changes. Google Fonts provides
DM Sans and Bricolage Grotesque, with system fallbacks when unavailable.

## Server accounts (AUTH-01)

Vite proxies `/api` requests from React to Spring Boot. `AccountController` handles
registration, login, logout, session restore, and account updates under
`/api/auth`. `AccountStore` uses `JdbcClient` to run SQL against MySQL.

Migration 002 links credentials and sessions to MySQL account IDs. Passwords
retain the original scrypt parameters and per-account salt. The browser
receives an HttpOnly cookie, and MySQL stores the hash of its token. Sessions
expire after seven days. Signing out revokes the current session, and changing
an email address or password revokes old sessions for that account.

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

Add and edit share the form and icon upload in `src/subscriptions/SubscriptionEditor.jsx`.
`App` saves changes and updates the dashboard after MySQL confirms them. React
and Spring validate the same subscription fields. `tests/dashboard.test.js` covers
dates, sorting, and totals.

## Subscription data flow

`SubscriptionController` resolves the account from the session cookie and
passes its ID to `SubscriptionStore`. Every subscription query uses that owner
ID. The tables are defined in the [database migrations](../database/migrations).
