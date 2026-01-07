# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-parks.js

Imports and updates `Park` records from Strapi's `protected-area` collection by matching the `orcs` field with existing parks in the DOOT database.

**The script:**

- Fetches protected area data from Strapi using sync utilities
- Matches existing DOOT parks by comparing Strapi `orcs` with DOOT `orcs`
- Creates or updates park records with the data mapped in the table below
- Builds management area relationships from Strapi data using DOOT's ManagementArea and Section lookups

**Data mapping:**

| Strapi Field                        | DOOT Field            | Notes                                 |
| ----------------------------------- | --------------------- | ------------------------------------- |
| `protectedAreaName`                 | `name`                | Park name                             |
| `orcs`                              | `orcs`                | Used for matching existing records    |
| `parkOperation.inReservationSystem` | `inReservationSystem` | Defaults to false if not set          |
| `parkOperation.hasWinterFeeDates`   | `hasWinterFeeDates`   | Defaults to false if not set          |
| `parkOperation.hasTier1Dates`       | `hasTier1Dates`       | Defaults to false if not set          |
| `parkOperation.hasTier2Dates`       | `hasTier2Dates`       | Defaults to false if not set          |
| `managementAreas`                   | `managementAreas`     | Array of management area/section data |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import parks from Strapi
node tasks/import-parks/import-parks.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Parks without valid `orcs` values or without matching DOOT park records are skipped with warnings. The script shows:

- Number of protected areas found in Strapi
- Existing parks in DOOT for matching
- Per-record processing status (created/updated/skipped)
- Final summary with counts of created, updated, and skipped records
