# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-park-areas.js

Imports and updates `ParkArea` records from Strapi's `park-area` collection by matching the `orcsSiteNumber` with existing parks in the DOOT database.

**The script:**

- Fetches park area data from Strapi using existing sync utilities
- Matches park areas to parks by comparing the `orcsSiteNumber` from the Strapi `protectedArea` relation with the `orcs` field in DOOT parks
- Creates or updates park area records with name, active status, and reservation system flags
- Maps `parkId` by matching ORCS numbers between systems

**Data mapping:**

| Strapi Field                   | DOOT Field                     | Notes                               |
| ------------------------------ | ------------------------------ | ----------------------------------- |
| `parkAreaName`                 | `name`                         | Park area name                      |
| `isActive`                     | `active`                       | Defaults to `true` if not provided  |
| `inReservationSystem`          | `inReservationSystem`          | Defaults to `false` if not provided |
| `protectedArea.orcsSiteNumber` | Used to match with `Park.orcs` | Required for matching               |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park areas from Strapi
node tasks/import-park-areas/import-park-areas.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Park areas without valid ORCS numbers or matching parks are skipped with warnings.

## Why is this useful?

- **Data synchronization**: Keeps DOOT park areas in sync with Strapi CMS data
- **Safe operations**: Transaction-based with automatic rollback on errors
- **Idempotent**: Can be run multiple times safely without creating duplicates
- **Detailed logging**: Provides clear feedback on what was processed and any issues

## Notes

- Script assumes Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- Requires existing Park records in DOOT with matching ORCS numbers
- Only processes park areas with valid `orcsSiteNumber` in their `protectedArea` relation
- Environment variables for Strapi API access must be configured
