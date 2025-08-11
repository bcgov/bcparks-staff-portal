# Season and Date Re-Sync Scripts

This folder contains scripts to manage and synchronize `Season` and `DateRange` data in the BC Parks Staff Portal database.
These scripts are used to delete all existing season/date data and re-import it from Strapi sources and other data files.

## What do these scripts do?

The main re-sync script (`re-sync-season-and-dates.js`) performs the following steps:

1. **Deletes all existing Seasons, SeasonChangeLogs, and DateRanges**
   Ensures a clean slate before re-importing data.

2. **Creates blank seasons for 2026**
   Runs the `create-seasons.js` script as a child process to ensure all necessary seasons exist for the upcoming operating year.

3. **Imports sub-area dates from Strapi**

   - Only imports entries where `isActive` is `true`.
   - Creates or updates `Season` records based on `operatingYear`.
   - Sets `Season.editable` to `false` if the year is in the past.
   - Sets `Season.readyToPublish` to `true` and `Season.status` to `published`.
   - Finds the correct `publishableId` from `Feature` or `ParkArea`.
   - Creates or updates `DateRange` records for service and reservation dates.

4. **Imports park feature dates from Strapi**

   - Only imports entries where `isActive` is `true`.
   - Creates or updates `Season` records based on `operatingYear`.
   - Sets `Season.editable` to `false` if the year is in the past.
   - Sets `Season.readyToPublish` to `true` and `Season.status` to `published`.
   - Finds the correct `publishableId` from `Feature` or `ParkArea`.
   - Creates or updates `DateRange` records for each feature date, using the correct `DateType`.

5. **Imports park operating (gate) dates from Strapi**

   - For each Park with a `publishableId`, finds all Strapi `park-operation-date` entries where `protectedArea.orcs` matches the Park's `orcs`.
   - For each unique `operatingYear`, creates or finds a `Season`.
   - For each Season, creates or updates a `DateRange` for the `"Operating"` date type.
   - All operations are performed inside a transaction for safety.

6. **Imports previous dates from JSON**

   - Imports previous dates from a JSON file and populates `Season` and `DateRange` records for historical data.

7. **Logs progress before and after each step**
   - Each step logs its start and completion for easier tracking and troubleshooting.

## How to run

From your project root, run:

```sh
node tasks/re-sync-seasons-and-dates/re-sync-season-and-dates.js
```

This will execute all steps in order, fully resetting and re-importing all season and date data.

## Output

- The script logs progress before and after each step.
- On success, you will see `"All re-sync season and date scripts completed."`
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Completely resets your `Season` and `DateRange` data by deleting all existing records and re-importing them from Strapi and historical data files.
- Ensures every Park, ParkArea, and Feature with a `publishableId` has an up-to-date `Season` for each operating year found in Strapi or the data files.
- Guarantees that each `Season` has the correct `DateRange` records, matching the latest Strapi and historical data.
- Keeps your database fully synchronized with Strapi's park operation, feature, and sub-area date data, as well as any historical records.
- The script is idempotent: you can safely run it multiple times. It will not create duplicates and will recreate date ranges as needed to match the source data.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- All scripts use database transactions for safety.
- Make sure your Strapi API and database are accessible before running.
- If you add new Parks, ParkAreas, Features, or Strapi data, re-running this script will add or update any missing or changed `Season` and `DateRange` entries as needed.
- Data will be deleted and re-imported, so backup if needed.
- Any unpublished dates in the system will be deleted. Be sure to publish any dates you want to keep before running this script.
