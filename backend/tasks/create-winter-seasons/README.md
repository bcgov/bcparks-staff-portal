# create-winter-seasons.js

This script creates Winter seasons and placeholder Winter fee DateRanges for the specified operating year.

Creation rules:

- Park-level Winter seasons are created from `park.hasWinterFeeDates = true`.
- ParkArea/Feature-level Winter seasons are created from `feature.hasWinterFeeDates = true`.
- `parkArea.hasWinterFeeDates` is ignored for season creation.

## What does the script do?

1. **Identifies and processes parks with winter fee dates:**
   - Finds all parks where `hasWinterFeeDates = true`
   - Ensures each park has required `publishableId` and `dateableId` (creates them if missing)

2. **Identifies and processes features with winter fee dates:**
   - Finds all active features where `hasWinterFeeDates = true`
   - Ensures each feature has required `dateableId` (creates it if missing)
   - If a feature belongs to a park area, creates/uses the Winter season on the parent park area's `publishableId`
   - If a feature is independent (no park area), creates/uses a Winter season on the feature's own `publishableId`

3. **Creates winter seasons for the specified operating year:**
   - Creates new seasons with `seasonType = "winter"`
   - Sets `status` using `resolveNewSeasonStatus(...)` and `readyToPublish = true`
   - Skips creation if a Winter season already exists for the same publishable/year

4. **Creates Winter fee DateRanges in winter seasons:**
   - Creates new Winter fee DateRanges linked to the winter seasons
   - Sets `startDate = null` and `endDate = null` (placeholder; later filled/calculated)
   - Uses the "Winter fee" DateType from the database

5. **Creates DateRangeAnnual only for park-level Winter fee setup:**
   - Park-level Winter fee DateRanges get `DateRangeAnnual` entries
   - ParkArea/Feature-level Winter fee DateRanges do not get `DateRangeAnnual` entries

6. **All operations are performed inside a transaction** for safety and atomicity.

## How does it find Winter fee DateType?

- The script queries the database for a DateType with `dateTypeNumber = WINTER_FEE`
- If this DateType doesn't exist, the script exits with an error
- This DateType must exist in your database before running the script

## How to run

**Usage:** The script requires an operating year as a command-line argument.

From your project root, run:

```sh
# Example: create seasons for the 2027 operating year
node tasks/create-winter-seasons/create-winter-seasons.js 2027
```

## Output

```
STARTING CREATE-WINTER-SEASONS FOR OPERATING YEAR 2027

Found 12 Parks with Winter Fee Dates
Found 8 Features with Winter Fee Dates
Created winter season for Cypress Provincial Park (Publishable 123) - 2027
Created winter fee date range for Cypress Provincial Park (Season 456)
Created winter season for Cypress Frontcountry Area (park area) (Publishable 789) - 2027
Created winter fee date range for Cypress Frontcountry Campground (Cypress Frontcountry Area) (Season 987)
...

Summary:
Added 0 missing Publishables
Added 0 missing Dateables
Added 11 new Winter Seasons
Added 11 new Winter Fee DateRanges
Added 3 new Park-level Winter Fee DateRangeAnnuals

Done creating winter seasons for 2027
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
- Winter seasons are created with `readyToPublish = true`
- Park-level creation is driven by `park.hasWinterFeeDates`
- ParkArea/Feature-level creation is driven by `feature.hasWinterFeeDates`
- `parkArea.hasWinterFeeDates` is not used by this script
- If you need to add winter fee capability to additional parks, set `hasWinterFeeDates = true` on those parks first
- The operating year parameter is required and must be a valid number (e.g., 2027)
