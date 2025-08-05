# Season and Date Re-Sync Scripts

This folder contains scripts to manage and synchronize `Season` and `DateRange` data in the BC Parks Staff Portal database.
These scripts are used to delete all existing season/date data and re-import it from Strapi sources.

---

## Scripts Overview

### 1. `delete-seasons-and-dates.js`

Deletes **all** entries from the `Season` and `DateRange` tables.
Use this to clear out old or incorrect data before re-importing.

### 2. `import-sub-area-dates.js`

Imports dates from Strapi's `park-operation-sub-area-date` collection:

- Only imports entries where `isActive` is `true`.
- Creates or updates `Season` records based on `operatingYear`.
- Sets `Season.editable` to `false` if the year is in the past.
- Updates `Season.readyToPublish` and `Season.status`.
- Finds the correct `publishableId` from `Feature` or `ParkArea`.
- Creates or updates `DateRange` records for service and reservation dates.

### 3. `import-park-feature-dates.js`

Imports dates from Strapi's `park-feature-date` collection:

- Only imports entries where `isActive` is `true`.
- Creates or updates `Season` records based on `operatingYear`.
- Sets `Season.editable` to `false` if the year is in the past.
- Updates `Season.readyToPublish` and `Season.status`.
- Finds the correct `publishableId` from `Feature` or `ParkArea`.
- Creates or updates `DateRange` records for each feature date, using the correct `DateType`.

### 4. `re-sync-season-and-dates.js`

**Main runner script** that executes the above scripts in order:

1. Deletes all seasons and date ranges.
2. Imports sub-area dates.
3. Imports park feature dates.
4. Logs progress before and after each step.

---

## How to Run

From your project root, run:

```sh
node backend/tasks/re-sync-seasons-and-dates/re-sync-season-and-dates.js
```

---

## Notes

- All scripts use database transactions for safety.
- You can safely re-run these scripts to refresh season and date data from Strapi.
- Make sure your Strapi API and database are accessible before running.

---

## Troubleshooting

- If you encounter errors, check the console output for details.
- Ensure your Sequelize models and Strapi endpoints are up-to-date.
- Data will be deleted and re-imported, so backup if needed.
