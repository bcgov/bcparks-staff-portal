# fix-orphaned-dateranges.js

This script fixes orphaned `DateRange` records associated with incorrect `Season` records due to changes in Feature/ParkArea relationships.

## What does the script do?

The script runs two fixes sequentially:

### 1. fixDateRangesForFeatureParkAreaChanges

Fixes DateRanges when a Feature's ParkArea relationship has changed but DateRanges remain associated with the old Season.

**Process:**

- Finds Seasons where DateRanges belong to Features whose current ParkArea doesn't match the Season's ParkArea.
- Identifies the correct Season (matching the Feature's current ParkArea).
- Moves DateRanges (filtered by dateableId) to the correct Season, deleting any existing incomplete DateRanges first.
- Skips if target Season already has valid DateRanges.

### 2. fixDateRangesForFeatureStandaloneToggle

Fixes DateRanges when Features toggle between standalone status and being part of a ParkArea.

**Process:**

- Identifies `dateableId` values with DateRanges associated with multiple `publishableId` values in the same year.
- Retrieves the Feature and its current ParkArea (if any), plus all related Seasons.
- Moves DateRanges based on current status:
  - Feature in ParkArea → moves from standalone Season to ParkArea Season
  - Feature standalone → moves from ParkArea Season to standalone Season
- Deletes incomplete DateRanges before moving; skips if target has valid DateRanges.

## Prerequisites

Run after `create-seasons.js` to address data inconsistencies from season creation.

## Usage

```sh
node tasks/fix-orphaned-dateranges/fix-orphaned-dateranges.js 2027
```

Replace `2027` with the desired operating year.

## Notes

- Processes one operating year at a time.
- Safe to run multiple times; only updates DateRanges still needing fixes.
- All operations run in a transaction and roll back on errors.
