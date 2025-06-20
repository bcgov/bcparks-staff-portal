# create-date-range-annual.js

This script creates `DateRangeAnnual` entries in the database based on existing `Publishable`, `Season`, `DateRange`, and `Park` data. It is designed to ensure that each valid combination of `publishableId` and `dateTypeId` has a corresponding `DateRangeAnnual` entry, without creating duplicates.

---

## What does the script do?

1. **Creates `DateRangeAnnual` entries for all valid date ranges:**
   - For each `Publishable`, it finds all related `Season` records.
   - For each `Season`, it finds all associated `DateRange` records (and their `DateType`).
   - For each `DateRange`, it creates a `DateRangeAnnual` entry for the combination of `publishableId` and `dateTypeId`, **unless** the `DateType` name is `"Tier 1"`, `"Tier 2"`, or `"Operating"`.
   - If an entry already exists, it is not duplicated.

2. **Creates `DateRangeAnnual` entries for all Parks with a `publishableId` and the `"Operating"` date type:**
   - For each `Park` with a non-null `publishableId`, it creates a `DateRangeAnnual` entry for the combination of that `publishableId` and the `dateTypeId` of the `DateType` named `"Operating"`.
   - Again, if an entry already exists, it is not duplicated.

3. **All operations are performed inside a transaction** for safety and atomicity.

---

## How to run

From your project root, run:

```sh
node backend/tasks/create-date-range-annual/create-date-range-annual.js
```

---

## Output

- The script logs each new `DateRangeAnnual` entry it creates.
- At the end, it logs `"DateRangeAnnual creation complete."`
- If any error occurs, the transaction is rolled back and an error message is printed.

---

## Why is this useful?

- Ensures your `DateRangeAnnual` table is up-to-date with all valid combinations from your business logic.
- Prevents duplicate entries.
- Handles both general date ranges and the special `"Operating"` type for parks.

---

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates.
- If you add new `Publishable`, `Season`, `DateRange`, or `Park` records, re-running this script will add any missing `DateRangeAnnual` entries as needed.

---
