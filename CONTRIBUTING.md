# Contributing to SubSave

## Work from an issue

Use `main` for reviewed, stable changes. Create a branch for each GitHub issue:

```sh
git switch main
git pull --ff-only
git switch -c feature/<issue>-<short-name>
```

For fixes, use `fix/<issue>-<short-name>`. Keep the issue and its Trello card
linked, with an owner, acceptance criteria, and reviewer recorded.

## Develop and verify

Follow the README to install dependencies and run the app. Make small changes
within the issue's scope. Run `npm run lint` and `npm run build`, then check the
affected behavior in a browser. Use [the setup checklist](tests/README.md) for
changes to the project environment. Run `npm test` for the frontend behavior
suite.

Commit `package-lock.json` when changing dependencies. Keep local credentials
in the ignored `backend/mysql.properties` file and keep build output and
`node_modules/` out of Git. Values exposed by Vite's
`VITE_` prefix are public browser configuration and must never contain secrets.

## Request a review

Use a descriptive commit message, for example
`chore: initialize React project for APP-01`.
Open a pull request against `main` describing the problem, change, issue number,
and verification results. Reference `Refs #1` while APP-01 sign-offs are pending;
avoid an automatic closing keyword until all acceptance criteria are verified.

Ask another team member to review the pull request and record their findings.
An author must not count their own checks as teammate review. Resolve findings
and rerun the relevant checks before merging. Protect `main` with required
reviews where the repository's GitHub plan supports that configuration.

## Mark work complete

Record verification evidence in the pull request or linked issue. For APP-01,
also complete [the setup sign-offs](docs/project-setup-verification.md).
Close the issue and move the Trello card to Done after acceptance checks and
review are complete. Do not treat documentation of a planned feature as evidence
that the feature is implemented.
