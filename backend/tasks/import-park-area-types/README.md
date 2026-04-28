# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-park-area-types.js

Imports and updates `ParkAreaType` records from Strapi's `park-area-type` collection by matching the `areaTypeId` with the `parkAreaTypeNumber` on existing park area types in the DOOT database.

**The script:**

- Fetches park area type data from Strapi using sync utilities
- Matches existing DOOT park area types by comparing Strapi `areaTypeId` with DOOT `parkAreaTypeNumber`
- Creates or updates park area type records with name, parkAreaTypeNumber and rank
- Uses efficient Map-based lookup for fast matching between systems

**Data mapping:**

| Strapi Field   | DOOT Field            | Notes                              |
| -------------- | --------------------- | ---------------------------------- |
| `parkAreaType` | `name`                | Park Area type name                |
| `areaTypeId`   | `parkAreaTypeNumber`  | Used for matching existing records |
| `rank`         | `rank`                | Used for display sorting           |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park area types from Strapi
node tasks/import-park-area-types/import-park-area-types.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Park Area types without valid `areaTypeId` values are skipped with warnings. The script shows:

- Number of park area types found in Strapi
- Existing `parkAreaTypeNumber` values in DOOT for debugging
- Per-record lookup results and processing status
- Final summary with counts of created, updated, skipped and unchanged records
