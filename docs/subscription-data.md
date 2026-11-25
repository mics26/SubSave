# DATA-03 subscription data contract

The team can use [the shared sample subscriptions](../src/subscriptions/sampleSubscriptions.js) in the dashboard and forms. The demo owner ID is a fixture. Signed-in accounts start with their own records.

```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "ownerId": "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  "name": "Spotify Premium",
  "category": "Music & Audio",
  "cost": 149,
  "billingCycle": "Monthly",
  "nextRenewal": "2026-11-05",
  "iconPreset": "spotify",
  "icon": null
}
```

| Field | Rules |
| --- | --- |
| `id`, `ownerId` | UUID strings in application records. The server generates `id` and takes `ownerId` from the authenticated session. MySQL stores both as `BINARY(16)`. |
| `name` | Trimmed, 1–120 characters. |
| `category` | `Entertainment`, `Music & Audio`, `Developer Tools`, `Cloud Storage`, `Productivity`, or `General`. |
| `cost` | Positive PHP amount for the full billing cycle, with up to two decimal places. MySQL uses `DECIMAL(12,2)` and the application receives a JSON number. The dashboard normalizes yearly amounts for its monthly totals. |
| `billingCycle` | `Monthly` or `Yearly`. |
| `nextRenewal` | Valid calendar date in `YYYY-MM-DD` from `1000-01-01` onward. Stored as a MySQL `DATE` and returned as a date-only string. |
| `iconPreset`, `icon` | Optional on input, defaulting to `auto` and `null`. Other presets are `none`, `spotify`, `netflix`, `github`, `google-one`, and `custom`. Custom icons use a base64 PNG or JPEG data URL up to 1 MiB decoded. `icon` is `null` for all other presets. |

## Operations

The [server-side store](../server/subscriptions/subscriptionStore.js) binds one authenticated account with `createSubscriptionStore(pool, accountId)`. DATA-01 and APP-03 can use the same signatures in their fixtures while the server integration is underway.

| Operation | Result |
| --- | --- |
| `list()` | The account’s records sorted by renewal date and ID, or `[]`. |
| `add(input)` | The record with its assigned ID and owner. |
| `edit(id, input)` | The updated record, or `null` for an ID absent from this account. The input replaces the editable fields. |
| `delete(id)` | `true` when a record is removed, or `false` for an ID absent from this account. |

`input` contains the editable fields from the table. It excludes `id` and `ownerId`. Invalid input is rejected before a query runs. Account filters and prepared statements apply to every operation. An ID from another account and a missing ID return the same result on edit or delete.

AUTH-01 must take the account ID from a verified server session before calling the store. Keep the MySQL connection and credentials on the server. MySQL enforces the foreign key and data constraints. The store enforces per-account access, so browser requests must pass through the authenticated server API. The `accounts` table currently reserves account IDs for AUTH-01. The existing browser demo stores local account data and keeps added subscriptions in memory. Server-backed sign-in and hooking the UI up to saved subscriptions belong to AUTH-01, DATA-01, and APP-03.

## View project data in MySQL Workbench

Use `subsave` as the local project database. In MySQL Workbench, open the local MySQL Server 8.4 connection and select `subsave`. On first setup, create the schema with `utf8mb4` and run [migration 001](../database/migrations/001_create_accounts_and_subscriptions.sql) with that schema selected. The migration creates `accounts` and `subscriptions`.

Use Workbench to inspect saved subscription records as the app is connected to MySQL:

```sql
SELECT BIN_TO_UUID(owner_id) AS owner_id, name, cost, billing_cycle, next_renewal
FROM subsave.subscriptions
ORDER BY next_renewal, name;
```

## Automated ownership test

To rerun the automated check, apply the migration to a disposable schema and connect using a MySQL account with read and write access to its tables. Supply your credentials locally, with any special characters in the URL percent-encoded.

```powershell
$env:SUBSAVE_MYSQL_TEST_URL = 'mysql://USER:PASSWORD@127.0.0.1:3306/DISPOSABLE_SCHEMA'
npm run test:mysql
Remove-Item Env:SUBSAVE_MYSQL_TEST_URL
```

The test creates two temporary application accounts and verifies that each can work with its own records, cannot edit or delete the other account’s records, and cannot set a different owner when adding or editing. It cleans up those accounts and verifies the foreign key, cascade, and cost constraint.
