# populate-missing-dateable-id.js

This script populates missing `dateableId` fields in existing `DateRange` records in your database.
It does **not** create new `DateRange` records—only updates those where `dateableId` is currently `null`.

## What does the script do?

1. **For each `DateRange` with a missing `dateableId`:**
   - Looks up the associated `Season` using `seasonId`.
   - Uses the `publishableId` from the `Season` to find the corresponding `dateableId` from the `Park`, `ParkArea`, or `Feature` tables.
   - Updates the `DateRange` with the found `dateableId`.

2. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-missing-dateable-id/populate-missing-dateable-id.js
```

## Output

- The script logs each update and a summary of how many `DateRange` records were updated.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures every `DateRange` record has the correct `dateableId` based on its associated `Season`.
- Keeps your database consistent and ready for queries that rely on `dateableId`.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will only update records where `dateableId` is missing.
- If a `dateableId` cannot be found for a `DateRange`, the script will log a warning and
