# create-date-range-annual.js

This script creates and updates `DateRangeAnnual` entries in the database based on existing `Publishable`, `Season`, `DateRange`, `DateType`, `Park`, and Strapi `park-operation` data. It ensures that each valid combination of `publishableId`, `dateTypeId`, and `dateableId` has a corresponding `DateRangeAnnual` entry, and that the `isDateRangeAnnual` field is kept in sync with Strapi.

## What does the script do?

1. **Creates or updates `DateRangeAnnual` entries for all valid date ranges:**

   - For each `Publishable`, it finds all related `Season` records.
   - For each `Season`, it finds all associated `DateRange` records (and their `DateType`).
   - For each `DateRange`, it creates or updates a `DateRangeAnnual` entry for the combination of `publishableId`, `dateTypeId`, and `dateableId`, **unless** the `DateType` name is `"Tier 1"` or `"Tier 2"`.
   - If an entry already exists, it updates the `dateableId` if it has changed.

2. **Creates or updates `DateRangeAnnual` entries for all Parks with a `publishableId` and the `"Park gate open"` date type:**

   - For each `Park` with a non-null `publishableId`, it finds the corresponding Strapi `park-operation` by matching the `orcs` code.
   - It finds the correct `dateableId` for the park's `"Park gate open"` date range.
   - It uses the `isDateRangeAnnual` value from Strapi `park-operation` data and sets it on the `DateRangeAnnual` entry for that park, `dateTypeId`, and `dateableId`.
   - If the entry already exists and either `isDateRangeAnnual` or `dateableId` differs, it updates those fields to match the latest data.

3. **All operations are performed inside a transaction** for safety and atomicity.

## How does it get Strapi data?

- The script fetches Strapi data using the `/park-operations` endpoint, requesting the `orcs` field of the related `protectedArea`.
- It builds a lookup of `orcs` to `isDateRangeAnnual` from the Strapi response, ensuring accurate mapping to each Park.

## How to run

From your project root, run:

```sh
node tasks/create-date-range-annual/create-date-range-annual.js
```

To **clean** all `DateRangeAnnual` records (delete all):

```sh
node tasks/create-date-range-annual/clean-all-date-range-annuals.js
```


## Output

- The script logs each new or updated `DateRangeAnnual` entry.
- At the end, it logs `"DateRangeAnnual creation complete."`
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures your `DateRangeAnnual` table is up-to-date with all valid combinations from your business logic and Strapi data.
- Prevents duplicate entries.
- Keeps the `isDateRangeAnnual` and `dateableId` fields in sync with the source of truth (Strapi and your DB).
- Handles both general date ranges and the special `"Park gate open"` type for parks.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update `isDateRangeAnnual` and `dateableId` as needed.
- If you add new `Publishable`, `Season`, `DateRange`, `Park`, or update Strapi `park-operation` data, re-running this script will add or update any missing or changed `DateRangeAnnual` entries as needed.
- Strapi has `isDateRangeAnnual` only for the park gate open dates for now
