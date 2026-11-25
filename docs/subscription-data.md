# DATA-03 subscription data contract

New accounts start with an empty subscription list.

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

| HTTP request | Result |
| --- | --- |
| `GET /api/subscriptions` | `{ subscriptions }`, sorted by renewal date and ID. |
| `POST /api/subscriptions` | `201` and `{ subscription }` with the assigned ID and owner. |
| `PUT /api/subscriptions/{id}` | `{ subscription }` with the updated fields. |
| `DELETE /api/subscriptions/{id}` | `204` after removal. |

Send the editable fields when adding or editing. The API rejects explicit `id`
and `ownerId` values in the request body. The controller gets the owner from the
session cookie, and [SubscriptionStore](../backend/src/main/java/com/subsave/SubscriptionStore.java)
binds that owner in each SQL statement. An invalid session returns `401`. Edit
and delete return `404` for both missing records and records owned by another
account.

See the [README](../README.md#view-saved-subscriptions-in-workbench) for the
Workbench query.
