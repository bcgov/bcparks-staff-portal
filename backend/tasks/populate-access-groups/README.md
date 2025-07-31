# populate-access-groups.js

This script populates the `AccessGroup`, `AccessGroupPark`, `User`, and `UserAccessGroup` tables in your database based on data from `agreements-with-usernames.json`.

## What does the script do?

1. **Cleanup Existing Data (optional):**

   - Deletes all records from `AccessGroup`, `AccessGroupPark`, and `UserAccessGroup` tables before populating new data.

2. **For each agreement in `agreements-with-usernames.json`:**

   - **Creates (or updates) an AccessGroup** using the agreement's `id`, and updating the name if it has changed.
   - **Finds Parks** by their ORCS codes and links them to the AccessGroup via `AccessGroupPark`.
   - **Creates (or finds) Users** using usernames, emails, and names from the agreement data. Skips users without a username.
   - **Creates UserAccessGroup relations** to link each User to the AccessGroup by username.

3. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-access-groups/populate-access-groups.js
```

## Output

- The script logs `"AccessGroup population complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures your database is populated with up-to-date Access Groups, Parks, Users, and their relationships based on the latest agreements.
- Keeps your database in sync with the agreement data.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update relationships as needed.
- If you add new agreements or Users, re-running this script will add or update any missing or changed entries as needed.
- **The script uses username-based relationships:** `UserAccessGroup` uses `username` (string) as the foreign key to `User.username`.
- **Users without usernames are skipped** - they will not have access until they get proper usernames assigned.
- The script uses `upsert` for AccessGroups and `findOrCreate` for relationships to ensure data consistency.
