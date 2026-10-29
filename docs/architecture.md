# SubSave architecture

## Current foundation

SubSave is a browser application built with React and JavaScript using Vite.
`index.html` loads `src/main.jsx`, which mounts `App` inside React Strict Mode.
`src/App.jsx` renders a startup placeholder and `src/index.css` supplies its
styles. Vite serves the app during development and builds static assets into
`dist/` for production. Oxlint checks the JavaScript and JSX source.

There are currently no network API calls, backend services, external fonts,
authentication, or persisted subscription records. No environment variables
are required to start the app.

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
