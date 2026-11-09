# Account feature verification — issue #7

Branch: `feature/7-local-account`. Run `npm.cmd run dev` in PowerShell and use
the same printed URL throughout testing. Browser UI verification is left to
the user; the checklist below records what still needs manual verification.

## Automated checks

```sh
npm test
npm run lint
npm run build
```

The Node test runner exercises real password hashing and the account service
with an isolated in-memory storage adapter. It checks registration, validation,
normalized duplicate emails, login/logout, restoration by a fresh service,
profile edits and changed credentials, stale sessions, simulated recovery,
expiry/attempt limits, recovery invalidation, and corrupt/blocked/full storage.
These tests do not replace browser interaction checks.

## Manual acceptance checklist

Use made-up emails and passwords. No email or server connection is needed.

- [ ] Submit an empty registration. Check name, email, and password errors.
- [ ] Try an invalid email, password shorter than eight characters, and
  mismatched confirmation. Correct them and register successfully.
- [ ] Check that registration shows your avatar/name and a success message.
  Refresh and confirm you remain logged in.
- [ ] Open **Your account** from the avatar menu. Change your name and save.
  Refresh, reopen the account page, and confirm the name persisted.
- [ ] Change your email with a missing/wrong current password; verify it fails.
  Enter the correct password, save, refresh, and confirm the new email persisted.
- [ ] Change your password using the current password and matching new fields.
  Log out. Confirm the old password fails and the new password works.
- [ ] Log out, refresh, and verify you stay logged out. Log back in with your
  updated email/password. Check wrong and unknown credentials show errors.
- [ ] Try registering the same email with different casing; check the duplicate
  error. Register a second account, then try changing its email to the first
  account's email; check the duplicate error and that its details remain intact.
- [ ] From **Log in → Forgot password?**, try an unknown email, then a known
  email. Confirm the screen says no email was sent and displays a demo code.
- [ ] Try an incorrect code and mismatched new passwords. Submit the displayed
  code and matching valid passwords. Check the success message, then verify
  the old password fails and the new password logs in, including after refresh.
- [ ] Request a code, close the dialog or refresh, and confirm you must request
  another code. Check **Request new code** and **Back to login** navigation.
- [ ] Open the same origin in another tab. Login/logout and saved profile changes
  should be reflected in the other tab without refreshing it.
- [ ] At desktop width and mobile widths (320px and 390px), check the header,
  fullscreen account dialogs, account page, validation messages, and buttons.
  Confirm all fields remain reachable by scrolling with no horizontal overflow.
- [ ] Use Tab/Shift+Tab, Enter to submit, Escape to close dialogs, and the
  password visibility buttons. Confirm focus stays inside open dialogs.
- [ ] Confirm the browser console has no errors during these flows.

## Commit and open a pull request

The feature branch is already created. No commit or push has been made for you.
After checking the app, run these commands from the repository root:

```sh
git branch --show-current
git status --short
git diff
npm test
npm run lint
npm run build
git add src/App.jsx src/index.css src/accounts package.json README.md tests/accounts.test.js tests/accounts.md tests/README.md docs/architecture.md
git diff --cached --stat
git commit -m "feat(account): add local account flows for issue #7"
git push -u origin feature/7-local-account
```

The branch command should print `feature/7-local-account`. Review the staged
files before committing. Do not stage `.env`, `node_modules`, or `dist`.
In PowerShell use `npm.cmd` if `npm.ps1` is blocked by execution policy.

Open GitHub's **Compare & pull request**, with **base: main** and
**compare: feature/7-local-account**. Suggested title:

> feat(account): add persistent demo account features

Suggested description (replace the manual verification line with your results):

```text
Adds registration, login/logout, simulated password recovery, and account
editing using local storage, with validation and the existing green MUI theme.
Accounts and sessions persist across refreshes; the dashboard retains sample
subscriptions. There is no backend or email recovery service.

Refs #7

Validation: npm test (12 passing), npm run lint, npm run build.
Manual verification: [record desktop/mobile flows checked and any findings].
```

Request a teammate review. Merge through the pull request after checks and
review pass. Close issue #7 once its acceptance criteria are verified.
