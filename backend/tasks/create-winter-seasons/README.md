# create-winter-seasons.js

This script creates winter seasons for parks that have winter fee dates (`hasWinterFeeDates = true`) and migrates Winter fee DateRanges from regular seasons to winter seasons. It ensures that Winter fee DateRanges only exist in winter seasons, not in regular seasons.

## What does the script do?

1. **Identifies and processes parks with winter fee dates:**
   - Finds all parks where `hasWinterFeeDates = true`
   - Ensures each park has required `publishableId` and `dateableId` (creates them if missing)

2. **Cleans up existing Winter fee DateRanges from regular seasons:**
   - Finds all regular seasons (`seasonType = "regular"` or `null`) for each park
   - Removes any Winter fee DateRanges from these regular seasons
   - Logs the number of DateRanges removed for each park

3. **Creates winter seasons for the specified operating year:**
   - Creates new seasons with `seasonType = "winter"`
   - Sets `status = "REQUESTED"` and `readyToPublish = true` (requires manual approval)
   - Skips creation if a winter season already exists for the park and year

4. **Creates Winter fee DateRanges in winter seasons:**
   - Creates new Winter fee DateRanges linked to the winter seasons
   - Sets `startDate = null` and `endDate = null` (to be filled later by park staff)
   - Uses the "Winter fee" DateType from the database

5. **All operations are performed inside a transaction** for safety and atomicity.

## How does it find Winter fee DateType?

- The script queries the database for a DateType with `name = "Winter fee"`
- If this DateType doesn't exist, the script exits with an error
- This DateType must exist in your database before running the script

## How to run

From your project root, run:

```sh
node tasks/create-winter-seasons/create-winter-seasons.js 2027
```

**Usage:** The script requires an operating year as a command-line argument.

## Output

```
Creating Winter Seasons for 2027
Found Winter fee DateType: 5
Found 12 Parks with Winter Fee Dates
Processing park: Cypress Provincial Park
Removed 1 Winter fee date ranges from regular seasons for Cypress Provincial Park
Created winter season for Cypress Provincial Park (Publishable 123) - 2027
Created winter fee date range for Cypress Provincial Park (Season 456)
Processing park: Mount Seymour Provincial Park
Winter season already exists for Mount Seymour Provincial Park (Publishable 124) - 2027
Winter fee date range already exists for Mount Seymour Provincial Park (Season 457)
...

Summary:
Added 0 missing Park Publishables
Added 0 missing Park Dateables
Added 11 new Winter Seasons
Added 11 new Winter Fee DateRanges
Removed 15 Winter Fee DateRanges from regular seasons
Committing transaction...
Done
```

- The script logs each park being processed and the actions taken
- Shows when existing records are found and skipped
- Provides a summary of all changes made
- If any error occurs, the transaction is rolled back and an error message is printed

## Why is this useful?

- Separates winter operations from regular park operations in the system
- Ensures Winter fee DateRanges only exist in appropriate winter seasons
- Prevents winter fees from appearing in regular season date ranges
- Allows different approval workflows for winter vs. regular seasons
- Maintains data integrity by using database transactions
- Safe to run multiple times without creating duplicates

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- You can safely run this script multiple times; it will not create duplicates and will skip existing records
- Winter seasons are created with `readyToPublish = true` and must be manually approved before publishing
- The script only processes parks with `hasWinterFeeDates = true` - other parks are ignored
- If you need to add winter fee capability to additional parks, set `hasWinterFeeDates = true` on those parks first
- Winter fee DateRanges are **moved**, not copied - they will no longer exist in regular seasons after running this script
- The operating year parameter is required and must be a valid number (e.g., 2027)
