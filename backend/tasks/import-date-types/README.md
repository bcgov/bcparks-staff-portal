# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-date-types.js

Imports and updates `DateType` records from Strapi's `park-date-type` collection by matching the `dateTypeId` with the `strapiDateTypeId` on existing date types in the DOOT database.

**The script:**

- Fetches park date type data from Strapi using sync utilities
- Matches existing DOOT date types by comparing Strapi `dateTypeId` with DOOT `strapiDateTypeId`
- Creates or updates date type records the data mapped in the table below

**Data mapping:**

| Strapi Field   | DOOT Field         | Notes                        |
| -------------- | ------------------ | ---------------------------- |
| `dateType`     | `name`             | Date type name               |
| `dateTypeId`   | `strapiDateTypeId` | Well known key               |
| `description`  | `description`      | Date type description        |
| `featureLevel` | `featureLevel`     | Defaults to false if not set |
| `parkLevel`    | `parkLevel`        | Defaults to false if not set |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park date types from Strapi
node tasks/import-date-types/import-date-types.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Date types without valid `dateTypeId` values are skipped with warnings. The script shows:

- Number of park date types found in Strapi
- Existing `strapiDateTypeId` values in DOOT for debugging
- Per-record lookup results and processing status
- Final summary with counts of created, updated, and skipped records
