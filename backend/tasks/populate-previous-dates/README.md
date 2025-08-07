# populate-previous-dates.js

This script populates the `Season` and `DateRange` tables in your database based on data from a JSON file (`previous-dates.json`) and existing Parks.

## What does the script do?

1. **For each Park with a `publishableId`:**

   - Finds all entries in `previous-dates.json` where `orcs` matches the Park's `orcs`.

2. **For each `operatingYear` in the matching data:**

   - Creates (or finds) a `Season` entry with the Park's `publishableId` and the given `operatingYear`.
   - Updates the Season's `status` to `"published"`, sets `readyToPublish` to `true`, and `seasonType` to `"regular"`.

3. **For each Season:**

   - Finds the correct `DateType` by `name` and `parkLevel: true`.
   - Creates (or finds) a `DateRange` entry with:
     - `seasonId` set to the Season's ID,
     - `dateTypeId` set to the ID of the matching `DateType`,
     - `startDate` and `endDate` from the JSON entry,
     - `dateableId` set to the Park's `dateableId`.
   - If a `DateRange` already exists for that Season and DateType but the dates differ, it updates the dates and `dateableId`.

4. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-previous-dates/populate-previous-dates.js
```

## Input

- The script reads from `tasks/populate-previous-dates/previous-dates.json`, which should contain an array of objects like:
  ```json
  [
    {
      "orcs": 117,
      "operatingYear": 2025,
      "dateType": "Winter fee",
      "startDate": "2024-10-31",
      "endDate": "2025-03-30"
    }
    // ... more entries ...
  ]
  ```

## Output

- The script logs `"Season and DateRange population from JSON complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures every Park with a `publishableId` has a `Season` for each operating year found in your JSON data.
- Ensures each Season has a corresponding `DateRange` for the specified date type, with dates matching your JSON.
- Keeps your database in sync with historical or bulk date data.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update date ranges as needed.
- If you add new Parks or update your JSON data, re-running this script will add or update any missing or changed `Season` and `DateRange` entries as needed.
- Only DateTypes with `parkLevel: true` are used for matching.
- If a required DateType is missing, the entry is skipped (consider logging a warning for missing types).
