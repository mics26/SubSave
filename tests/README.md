# Project setup verification

For the account features in issue #7, see [account verification](accounts.md).
Run `npm test` for the automated account behavior suite. The setup checks below
are historical APP-01 checks; the current app displays the dashboard.

These checks verify APP-01. Run the following from a fresh clone or a separate checkout
so an existing `node_modules/` directory cannot hide missing dependencies.

1. Confirm Git, Node.js 24, and npm 11+ are installed.
2. Clone the repository using your own GitHub account.
3. Check out the setup pull request branch until it is merged.
4. Run `npm ci`. Confirm it finishes successfully using `package-lock.json`.
5. Run `npm run lint` and `npm run build`. Both must exit successfully.
6. Run `npm run dev` and open the printed local address. Confirm the page title
   identifies SubSave, the heading reads SubSave, and the startup message is visible.
7. Refresh the page. Confirm it still renders without errors in the browser console.
8. Check a narrow mobile viewport. The text must remain readable without
   horizontal scrolling.
9. Stop the development server. Run `npm run preview` and open its local address.
   Confirm the built app displays the same startup page without console errors.
10. Stop the preview server. Run `git status --short`. Installing and building
    should not add `node_modules/`, `.env`, or `dist/` to tracked changes.

Record the date, operating system, Node/npm versions, commands, result, and any
findings in the pull request or issue. Complete your own row in
[`docs/project-setup-verification.md`](../docs/project-setup-verification.md).
Reviewer approval and teammate startup confirmations remain separate from the
author's local checks. Dashboard behavior is checked under APP-02.
