# SubSave requirements

## Purpose and users

SubSave helps people with monthly subscriptions see their recurring spending
and prepare for upcoming billing dates. The project proposal describes one
dashboard containing active subscriptions, total monthly costs, and renewal dates.

## Product scope

The planned product supports subscription entry through the proposed cart flow,
including the monthly cost and billing cycle. The dashboard will display active
subscription cards, a monthly expense overview, and upcoming renewals. A card
will turn red as its renewal approaches. Editing, deletion, and browser local
storage are also planned in the existing project backlog.

The team still needs to define the renewal warning period, currency rules,
supported billing cycles, and how nonmonthly costs affect the monthly total
before implementing that behavior.

## APP-01 project setup

Issue: https://github.com/mics26/SubSave/issues/1

- The repository includes a README, `.gitignore`, and `src/`, `tests/`, and `docs/`.
- Project documentation explains the stack, setup steps, team roles, and workflow.
- Team members have repository access and can clone and run the app locally.
- Review and verification evidence are recorded before the issue is closed.

The foundation implements only a React startup page and development tooling.
It does not implement the dashboard, subscription management, persistence,
renewal calculations, or authentication.

## APP-02 dashboard

Issue: https://github.com/mics26/SubSave/issues/2

The dashboard must have a subscription section, monthly expense overview,
an easy-to-navigate layout, and support for subscription cards. It depends on
APP-01. The existing merged documentation pull request describes this layout;
it does not implement the dashboard.

## Source context

The team supplied the SubSave Project Documentation proposal and the Project
Setup with Tools laboratory manual. GitHub issue descriptions and the linked
Trello cards track acceptance criteria. Historical sprint dates remain planning
context and do not determine whether work is complete.
