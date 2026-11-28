# SubSave

Track subscriptions, spending, and renewal dates. React sends requests to Spring Boot. Spring checks the session cookie to identify the account, then reads and writes that account’s data in MySQL using `JdbcClient`.

[Team contributions and presentation roles](docs/member-contributions.md)

## Run locally

Requires Java 21, Node.js 24, npm 11+, and MySQL at `localhost:3306`.

In Workbench, select the `subsave` schema and apply any missing SQL files in [database/migrations](database/migrations) in numeric order. Copy [mysql.properties.example](backend/mysql.properties.example) to `backend/mysql.properties` and fill in your MySQL login. Git ignores that file.

Start Spring in one terminal from the project root.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start React in a second terminal from the project root, then open the URL Vite prints.

```sh
npm ci
npm run dev
```

## View saved subscriptions in Workbench

```sql
SELECT BIN_TO_UUID(owner_id) AS account_id, name, cost, billing_cycle, next_renewal
FROM subsave.subscriptions
ORDER BY next_renewal, name;
```
