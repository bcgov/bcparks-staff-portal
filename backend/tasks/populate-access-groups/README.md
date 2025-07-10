# populate-access-groups.js

This script populates the `AccessGroup`, `AccessGroupPark`, `User`, and `UserAccessGroup` tables in your database based on data from `agreement.json`.

## What does the script do?

1. **Cleanup Existing Data (optional):**
   - Deletes all records from `AccessGroup`, `AccessGroupPark`, and `UserAccessGroup` tables before populating new data.

2. **For each agreement in `agreement.json`:**
   - **Creates (or finds) an AccessGroup** using the agreement's `id` and `name`.
   - **Finds Parks** by their ORCS codes and links them to the AccessGroup via `AccessGroupPark`.
   - **Creates (or finds) Users** using contact emails and names from the agreement.
   - **Creates UserAccessGroup relations** to link Users to AccessGroups.

3. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node backend/tasks/populate-access-groups/populate-access-groups.js
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
- If you add new agreements, Parks, or Users, re-running this script will add or update any missing or changed entries as needed.
- The script expects `UserAccessGroup` to use `userEmail` (string) as the foreign key to `User.email`.
