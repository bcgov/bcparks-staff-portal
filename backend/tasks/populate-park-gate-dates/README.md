# populate-park-gate-dates.js

This script populates the `Season` and `DateRange` tables in your database based on Strapi `park-date` data with the "Gate" date type and existing Parks.

## What does the script do?

1. **Fetches all `park-date` entries,** explicitly populating the `parkDateType` and `protectedArea` relations.

2. **Filters for park-dates that:**

   - Have a `parkDateType` with `dateTypeId` matching the constant `DATE_TYPE.PARK_GATE_OPEN` (the "Gate" type)
   - Have a non-null `protectedArea` relation

3. **For each valid park-date:**

   - Finds the Park in the local database matching `protectedArea.orcs`
   - Ensures the Park has a `publishableId` (creates one if missing)
   - Finds or creates a `Season` for the Park's `publishableId` and the park-date's `operatingYear` (with type `REGULAR`)
   - Finds or creates a `DateRange` for that Season and the "Park gate open" date type, using the park-date's `startDate` and `endDate`
   - If a `DateRange` already exists but the dates differ, updates the dates

4. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-park-gate-dates/populate-park-gate-dates.js
```

## Output

- The script logs `Season and DateRange population complete.` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures every Park with a `publishableId` has a `Season` for each operating year found in Strapi `park-date` data.
- Ensures each Season has a corresponding `DateRange` for the `"Park gate open"` date type, with dates matching Strapi.
- Keeps your database in sync with Strapi's park gate date data.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update date ranges as needed.
- If you add new Parks or Strapi `park-date` data, re-running this script will add or update any missing or changed `Season` and `DateRange` entries as needed.
- The script uses Strapi v5's explicit populate syntax to ensure `parkDateType` and `protectedArea` are available for filtering and processing.
