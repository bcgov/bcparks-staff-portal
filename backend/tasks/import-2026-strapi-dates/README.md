# Import 2026+ Strapi Dates

Reverse syncs operating year 2026+ dates that were modified in Strapi back into DOOT. Intended as a one-time operation in late August or early September 2026, before 2027 date collection begins.

## Files

Two scripts handle different entity types:

- `import-2026-strapi-feature-dates.js` - Syncs feature-level date ranges
- `import-2026-strapi-protected-area-dates.js` - Syncs park-level date ranges

## Prerequisites

This folder contains required data files:

- `feature-dates.json`
- `protected-area-dates.json`

These should be refreshed before running on production. Unlike other task scripts, these are included as JSON files because the Strapi REST API does not expose `created_by_id` and `updated_by_id`, which are central to the sync logic. See [PSQL.md](./PSQL.md) for regeneration instructions.

## Running

```bash
# Feature dates
node tasks/import-2026-strapi-dates/import-2026-strapi-feature-dates.js

# Protected area dates
node tasks/import-2026-strapi-dates/import-2026-strapi-protected-area-dates.js
```

## Dry Run

Set `const dryRun = true;` at the top of the script you are running to preview changes without writing to the database.

## What It Does

- Creates `Publishable` and `Dateable` records if missing
- Creates `Season` records for the operating year if they don't exist
- Creates new `DateRange` records from JSON data
- Deletes `DateRange` records not present in JSON data
- Creates or updates `DateRangeAnnual` records based on `is_date_annual` flag

Changes are wrapped in a transaction and rolled back on error.

## Expected Output

On the first run, expect non-zero counts for created and deleted records. On subsequent runs, all counters should report zero unless the JSON data files have changed. This indicates the database is in sync with the source data.
