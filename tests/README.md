# Project verification

Use a fresh checkout to check setup. Follow the [README](../README.md) to install
dependencies, start SubSave, and connect it to MySQL.

1. Run `npm test`, `npm run lint`, and `npm run build`.
2. Open the printed URL and confirm the welcome screen loads. Refresh and check
   the layout at 320px wide.
3. Use the [account and subscription checks](accounts.md) for sign-in, account
   isolation, and saved records. Use the [dashboard checks](dashboard.md) for
   spending, renewal warnings, and Demo Mode.
4. Run `git status --short` to confirm build output and local MySQL credentials
   are ignored.

Record the results in the pull request or linked issue.
