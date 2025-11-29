# populate-park-gate-dates.js

This script populates the `Season` and `DateRange` tables in your database based on Strapi `park-operation-date` data and existing Parks.

## What does the script do?

1. **For each Park with a `publishableId`:**

   - Finds all Strapi `park-operation-date` entries where `protectedArea.orcs` matches the Park's `orcs`.

2. **For each unique `operatingYear` in the matching Strapi data:**

   - Creates (or finds) a `Season` entry with the Park's `publishableId` and the given `operatingYear`.

3. **For each Season:**

   - Creates (or finds) a `DateRange` entry with:

     - `seasonId` set to the Season's ID,
     - `dateTypeId` set to the ID of the `DateType` named `"Park gate open"`,
     - `startDate` and `endDate` from the Strapi `park-operation-date` entry.

   - If a `DateRange` already exists for that Season and DateType but the dates differ, it updates the dates.

4. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-park-gate-dates/populate-park-gate-dates.js
```

## Output

- The script logs `"Season and DateRange population complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures every Park with a `publishableId` has a `Season` for each operating year found in Strapi.
- Ensures each Season has a corresponding `DateRange` for the `"Park gate open"` date type, with dates matching Strapi.
- Keeps your database in sync with Strapi's park operation date data.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update date ranges as needed.
- If you add new Parks or Strapi `park-operation-date` data, re-running this script will add or update any missing or changed `Season` and `DateRange` entries as needed.
