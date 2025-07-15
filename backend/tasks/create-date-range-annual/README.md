# create-date-range-annual.js

This script creates and updates `DateRangeAnnual` entries in the database based on existing `Publishable`, `Season`, `DateRange`, `DateType`, `Park`, and Strapi `park-operation` data. It ensures that each valid combination of `publishableId` and `dateTypeId` has a corresponding `DateRangeAnnual` entry, and that the `isDateRangeAnnual` field is kept in sync with Strapi.

## What does the script do?

1. **Creates `DateRangeAnnual` entries for all valid date ranges:**

   - For each `Publishable`, it finds all related `Season` records.
   - For each `Season`, it finds all associated `DateRange` records (and their `DateType`).
   - For each `DateRange`, it creates a `DateRangeAnnual` entry for the combination of `publishableId` and `dateTypeId`, **unless** the `DateType` name is `"Tier 1"`, `"Tier 2"`, or `"Operating"`.
   - If an entry already exists, it is not duplicated.

2. **Creates or updates `DateRangeAnnual` entries for all Parks with a `publishableId` and the `"Operating"` date type:**

   - For each `Park` with a non-null `publishableId`, it finds the corresponding Strapi `park-operation` by matching the `orcs` code.
   - It uses the `isDateRangeAnnual` value from Strapi `park-operation` data and sets it on the `DateRangeAnnual` entry for that park and the `"Operating"` `dateType`.
   - If the entry already exists and the value differs, it updates `isDateRangeAnnual` to match Strapi.

3. **All operations are performed inside a transaction** for safety and atomicity.

## How does it get Strapi data?

- The script fetches Strapi data using the `/park-operations` endpoint, requesting the `orcs` field of the related `protectedArea`.
- It builds a lookup of `orcs` to `isDateRangeAnnual` from the Strapi response, ensuring accurate mapping to each Park.

## How to run

From your project root, run:

```sh
node tasks/create-date-range-annual/create-date-range-annual.js
```

## Output

- The script logs each new or updated `DateRangeAnnual` entry.
- At the end, it logs `"DateRangeAnnual creation complete."`
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures your `DateRangeAnnual` table is up-to-date with all valid combinations from your business logic and Strapi data.
- Prevents duplicate entries.
- Keeps the `isDateRangeAnnual` field in sync with the source of truth (Strapi).
- Handles both general date ranges and the special `"Operating"` type for parks.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update `isDateRangeAnnual` as needed.
- If you add new `Publishable`, `Season`, `DateRange`, `Park`, or update Strapi `park-operation` data, re-running this script will add or update any missing or changed `DateRangeAnnual` entries as needed.
- Strapi has `isDateRangeAnnual` only for the park gate operating dates for now
