# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-park-areas.js

Imports and updates `ParkArea` records from Strapi's `park-area` collection by matching the `orcsAreaNumber` with existing park areas in the DOOT database, and sets the `parkId` relation by matching Strapi `protectedArea.orcs` to DOOT `park.orcs`.

**The script:**

- Fetches park area data from Strapi using sync utilities
- Matches existing DOOT park areas by comparing Strapi `orcsAreaNumber` with DOOT `strapiOrcsAreaNumber`
- Sets the `parkId` field in DOOT ParkArea by matching Strapi `protectedArea.orcs` to DOOT `park.orcs`
- Creates or updates park area records with name, active status, reservation system flags, and park relation
- Uses efficient Map-based lookup for fast matching between systems

**Data mapping:**

| Strapi Field          | DOOT Field             | Notes                               |
| --------------------- | ---------------------- | ----------------------------------- |
| `parkAreaName`        | `name`                 | Park area name                      |
| `isActive`            | `active`               | Defaults to `true` if not provided  |
| `inReservationSystem` | `inReservationSystem`  | Defaults to `false` if not provided |
| `orcsAreaNumber`      | `strapiOrcsAreaNumber` | Used for matching existing records  |
| `protectedArea.orcs`  | `parkId`               | DOOT Park ID, matched by ORCS value |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park areas from Strapi
node tasks/import-park-areas/import-park-areas.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Park areas without valid `orcsAreaNumber` values or without a matching DOOT Park for `parkId` are skipped with warnings. The script shows:

- Number of park areas found in Strapi
- Existing `strapiOrcsAreaNumber` values in DOOT for debugging
- Existing DOOT Park ORCS values for parkId matching
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
- Only sets `parkId` if a matching DOOT Park exists for the Strapi `protectedArea.orcs` value
- Environment variables for Strapi API access must be configured
