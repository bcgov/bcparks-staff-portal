# Date Range Population Scripts

This directory contains scripts for populating `DateRange` records for new operating years.

## populate-annual-date-ranges.js

Populates `DateRange` records for a given target year based on the previous year's `DateRange` entries, but **only if the associated `DateRangeAnnual` is marked as annual** (`isDateRangeAnnual` is `TRUE`). It copies the month and day from the previous year's dates, but updates the year to the target year.

**For each DateRangeAnnual marked as annual:**

- Finds the previous and target `Season` for the same `publishableId`.
- If both exist, finds all `DateRange` records for the previous season and the relevant `dateTypeId`.
- If the target season does **not** already have `DateRange` records for that `dateTypeId`, it creates new ones for the target year, copying the month and day from the previous year but updating the year.

## populate-blank-date-ranges.js

Creates blank `DateRange` records for all applicable seasons, dateables (Parks and Features), and date types for a given year. This script:

- Finds all seasons for the target year
- Determines applicable date types for each dateable based on their configuration (reservation, winter fee, etc.)
- Creates blank DateRange records for all missing season+dateable+dateType combinations
- Excludes existing records and Operating date type (handled by Gate date scripts)

## Transaction Safety

Both scripts perform all operations inside a transaction. If any error occurs, all changes are rolled back.

## How to run

**Most commonly:** These scripts are called automatically as part of the `create-seasons` script, which creates the new seasons and automatically executes both DateRange creation scripts in the correct order.

**Manual execution:** These scripts can also be run individually. Run the annual date ranges script first to populate dates for annual date types based on the previous year, then run the blank date ranges script to create any remaining necessary DateRange records for the new year.

```sh
# Copy annual DateRanges from previous year (run first)
node tasks/populate-date-ranges/populate-annual-date-ranges.js 2075

# Create blank DateRange records for all applicable combinations (run second)
node tasks/populate-date-ranges/populate-blank-date-ranges.js 2075
```

Replace `2075` with the year you want to populate.

## Output

Both scripts log their progress and provide summary messages on success. If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- **populate-annual-date-ranges.js**: Ensures new seasons have the correct date ranges based on the previous year's configuration for annual date types. This will show pre-populated date input fields in the form on the frontend.
- **populate-blank-date-ranges.js**: Creates blank DateRange records needed for all applicable seasons and date types for a new operating year. This will show empty date input fields in the form on the frontend.
- Both scripts prevent duplicate date ranges for the same season and date type

## Notes

- Both scripts assume your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- You can safely run these scripts multiple times; they will not create duplicates and will only add missing date ranges
- If you add new annual date types or seasons, re-running these scripts will add any missing date ranges as needed
