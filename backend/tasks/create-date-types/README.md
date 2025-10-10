# create-date-types.js

This script creates or updates `DateType` records in your database based on the data provided in `date-types.js`.

## What does the script do?

1. **For each entry in `date-types.js`:**

   - Checks if a `DateType` with the same `name` and level flags (`parkLevel`, `featureLevel`, `parkAreaLevel`) exists.
   - If not found, creates a new `DateType` record with the provided details.
   - If found, updates the existing record with the latest labels, description, and level flags.

2. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/create-date-types/create-date-types.js
```

## Input

- The script reads from `tasks/create-date-types/date-types.js`, which should export an array of objects like:

  ```js
  export const dateTypesData = [
    {
      name: "Winter fee",
      level: ["park"],
      startDateLabel: "Start",
      endDateLabel: "End",
      description: "Winter fee period",
      strapiDateTypeId: 123,
    },
    // ... more entries ...
  ];
  ```

## Output

- The script logs each created or updated `DateType` and prints `"All DateTypes created or updated successfully."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures all required `DateType` records exist in the database and are up to date.
- Updates existing `DateType` records with the latest labels, descriptions, and level flags.
- Keeps your database in sync with your application's date type definitions.
- The script is idempotent: you can run it multiple times without creating duplicates.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- If you add or modify entries in `date-types.js`, re-run this script to sync your database.
- If an error occurs, all changes will be rolled back.
