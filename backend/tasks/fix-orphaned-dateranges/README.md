# fix-orphaned-dateranges.js

This script identifies and fixes orphaned `DateRange` records that are associated with incorrect `Season` records due to changes in Feature/ParkArea relationships over time.

## What does the script do?

1. **Identifies orphaned DateRanges:**

   - Finds `dateableId` values that have `DateRange` records associated with multiple `publishableId` values in the same operating year.
   - This situation occurs when Features are moved between standalone status and ParkArea membership (or vice versa), but their DateRanges remain attached to the old Season.

2. **For each dateableId with multiple associated publishables:**

   - Retrieves the Feature and ParkArea (if any) for that dateableId.
   - Retrieves all Seasons associated with the DateRanges, along with their Feature/ParkArea relationships.

3. **Determines the correct Season:**

   - If the Feature currently belongs to a ParkArea (`feature.parkAreaId` is set):
     - DateRanges should be associated with the ParkArea's Season.
     - Moves DateRanges from the standalone Feature Season to the ParkArea Season.
   - If the Feature is currently standalone (`feature.parkAreaId` is null):
     - DateRanges should be associated with the Feature's own Season.
     - Moves DateRanges from the ParkArea Season to the Feature Season.

4. **Updates DateRanges:**

   - Deletes any existing incomplete DateRanges from the target Season.
   - Updates the `seasonId` of orphaned DateRanges to point to the correct Season.
   - Skips updates if the target Season already has valid DateRanges (with non-null start and end dates).

5. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## Prerequisites

This script should be executed after running the `create-seasons.js` script, as it addresses data inconsistencies that may arise from the season creation process.

## Usage

From your project root, run:

```sh
node tasks/fix-orphaned-dateranges/fix-orphaned-dateranges.js 2025
```

Replace `2025` with the operating year you want to fix.

## Output

- The script logs the number of dateableIds found with DateRanges for multiple publishables.
- For and skipped records, it logs why it was skipped.
- Final summary shows counts of updated and skipped DateRanges.

## Notes

- This script only processes one operating year at a time to limit the scope of changes.
- The script is designed to handle the specific case where a Feature has exactly two Seasons (one for standalone Feature, one for ParkArea). Other scenarios are logged but skipped.
- If the target Season already has valid DateRanges, the script will skip that update to avoid overwriting good data.
- You can safely run this script multiple times; it will only update DateRanges that still need fixing.
