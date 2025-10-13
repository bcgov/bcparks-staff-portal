# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-park-areas.js

Imports and updates `ParkArea` records from Strapi's `park-area` collection by matching the `orcsAreaNumber` with existing park areas in the DOOT database.

**The script:**

- Fetches park area data from Strapi using existing sync utilities
- Matches existing park areas by comparing the `orcsAreaNumber` from Strapi with the `strapiOrcsAreaNumber` field in DOOT park areas
- Creates or updates park area records with name, active status, and reservation system flags
- Uses efficient Map-based lookup for fast matching between systems

**Data mapping:**

| Strapi Field            | DOOT Field             | Notes                                    |
| ----------------------- | ---------------------- | ---------------------------------------- |
| `parkAreaName`          | `name`                 | Park area name                           |
| `isActive`              | `active`               | Defaults to `true` if not provided       |
| `inReservationSystem`   | `inReservationSystem`  | Defaults to `false` if not provided      |
| `orcsAreaNumber`        | `strapiOrcsAreaNumber` | Used for matching existing records       |
| `protectedArea.data.id` | `parkId`               | Park relationship ID from protected area |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park areas from Strapi
node tasks/import-park-areas/import-park-areas.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Park areas without valid `orcsAreaNumber` values are skipped with warnings. The script shows:

- Number of park areas found in Strapi
- Existing `strapiOrcsAreaNumber` values in DOOT for debugging
- Per-record lookup results and processing status
- Final summary with counts of created, updated, and skipped records

## Why is this useful?

- **Data synchronization**: Keeps DOOT park areas in sync with Strapi CMS data
- **Safe operations**: Transaction-based with automatic rollback on errors
- **Idempotent**: Can be run multiple times safely without creating duplicates
- **Detailed logging**: Provides clear feedback on what was processed and any issues

## Notes

- Script assumes Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- Uses efficient Map-based lookup to avoid multiple database queries per record
- Only processes park areas with valid `orcsAreaNumber` values from Strapi
- Converts integer `orcsAreaNumber` to string for consistent database field matching
- Environment variables for Strapi API access must be configured
