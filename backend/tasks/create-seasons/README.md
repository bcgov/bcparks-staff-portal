# create-seasons.js

This script creates Season records for Parks, ParkAreas, and Features for a specified operating year, along with their associated date ranges.

## What does the script do?

1. **Creates Seasons for all Parks with Features:**

   - Finds all parks that have at least one active feature
   - Ensures each park has required `publishableId` and `dateableId` (creates them if missing)
   - Creates a new Season record for the specified operating year
   - Creates blank Tier 2 date ranges for parks that had them in the previous year

2. **Creates Seasons for all ParkAreas with Features:**

   - Finds all park areas that contain at least one active feature
   - Ensures each park area has required `publishableId` and `dateableId` (creates them if missing)
   - Creates a new Season record for the specified operating year

3. **Creates Seasons for all Features without a ParkArea:**

   - Finds all active features that are not part of a park area
   - Ensures each feature has required `publishableId` and `dateableId` (creates them if missing)
   - Creates a new Season record for the specified operating year

4. **Creates next-year Seasons for Group Camping and Picnic Shelter Features:**

   - Finds all Group Camping and Picnic Shelter features in the BC Parks reservation system
   - Creates seasons for the **following year** (operating year + 1)
   - Creates seasons for parent ParkAreas if the feature belongs to one
   - Creates seasons for the feature itself if it doesn't belong to a ParkArea

5. **Populates DateRanges for new seasons:**

   - Copies annual date ranges from the previous year (where `isDateRangeAnnual = true`)
   - Creates blank date ranges for all new seasons
   - Populates date ranges for both the current year and next year

6. **All operations are performed inside a transaction** for safety and atomicity.

## How to run

From your project root, run:

```sh
node tasks/create-seasons/create-seasons.js 2027
```

**Usage:** The script requires an operating year as a command-line argument.

## Output

```
Creating Seasons for 2027
Found 150 Parks with Features
Added 5 missing Park Publishables
Added 3 missing Park Dateables
Added 150 new Park Seasons
Created 45 blank Tier 2 dates for park Cypress Provincial Park (Publishable 123)
Found 300 ParkAreas with Features
Added 10 missing ParkArea Publishables
Added 8 missing ParkArea Dateables
Added 300 new ParkArea Seasons
Found 50 Features with no ParkArea
Added 2 missing Feature Publishables
Added 2 missing Feature Dateables
Added 50 new Feature Seasons
Creating Group Camping and Picnic Shelter seasons for 2028
Found 25 Group Camping/Picnic Shelter Features
Added 5 missing Group Camping/Picnic Shelter Feature Publishables
Added 5 missing Group Camping/Picnic Shelter Feature Dateables
Added 25 new Group Camping/Picnic Shelter Feature Seasons
Populating annual date ranges for 2027...
Populating blank date ranges for 2027...
Populating blank date ranges for 2028...
Committing transaction...
Done
```

- The script logs progress for each step of season creation
- Shows number of Publishables/Dateables created for each level
- Shows number of Seasons created for Parks, ParkAreas, and Features
- Logs Tier 2 date creation for applicable parks
- Provides details on Group Camping/Picnic Shelter seasons for next year
- Confirms transaction commit when complete
- If any error occurs, the transaction is rolled back and an error message is printed

## Why is this useful?

- Automates the annual process of creating seasons across all park entities
- Ensures data consistency by creating all required Publishable and Dateable associations
- Handles complex hierarchical relationships between Parks, ParkAreas, and Features
- Preserves historical patterns (Tier 2 dates, annual date ranges) from previous years
- Creates future seasons for Group Camping and Picnic Shelter features that need advance booking
- Maintains data integrity by using database transactions
- Safe to run multiple times without creating duplicates

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- You can safely run this script multiple times; it will not create duplicates and will skip existing records
- Seasons are created with `status = "REQUESTED"` and `readyToPublish = true`
- The script operates at three levels: Park → ParkArea → Feature
- Group Camping and Picnic Shelter features require seasons for **both** the current year AND the following year
- Tier 2 dates are only created for parks that had them in the previous year and have `hasTier2Dates = true`
- Annual date ranges (`isDateRangeAnnual = true`) are automatically copied from the previous year
- All new seasons receive blank date ranges that need to be filled in by park staff
- The operating year parameter is required and must be a valid number (e.g., 2027)
- If the Tier 2 DateType is not found in the database, the script will skip Tier 2 date creation but continue processing

## Related Scripts

- [`populate-date-ranges/populate-annual-date-ranges.js`](../populate-date-ranges/populate-annual-date-ranges.js) - Copies annual date ranges from previous year
- [`populate-date-ranges/populate-blank-date-ranges.js`](../populate-date-ranges/populate-blank-date-ranges.js) - Creates blank date ranges for new seasons
- [`create-winter-seasons/`](../create-winter-seasons/README.md) - Creates winter seasons for parks with winter fee dates
