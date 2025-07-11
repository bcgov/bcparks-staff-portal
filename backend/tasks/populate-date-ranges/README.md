# populate-date-ranges.js

This script populates `DateRange` records for a given target year based on the previous year's `DateRange` entries, but **only if the associated `DateRangeAnnual` is marked as annual** (`isDateRangeAnnual` is `TRUE`). It copies the month and day from the previous year's dates, but updates the year to the target year.

## What does the script do?

1. **For each DateRangeAnnual marked as annual:**

   - Finds the previous and target `Season` for the same `publishableId`.
   - If both exist, finds all `DateRange` records for the previous season and the relevant `dateTypeId`.
   - If the target season does **not** already have `DateRange` records for that `dateTypeId`, it creates new ones for the target year, copying the month and day from the previous year but updating the year.

2. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node backend/tasks/populate-date-ranges/populate-date-ranges.js 2026
```

Replace 2026 with the year you want to populate.

## Output

- The script logs each copied DateRange and a summary message on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures new seasons have the correct date ranges based on the previous year's configuration for annual date types.
- Prevents duplicate date ranges for the same season and date type.
- Keeps your database in sync with annual scheduling logic.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will only add missing date ranges.
- If you add new annual date types or seasons, re-running this script will add any missing date ranges as needed.
