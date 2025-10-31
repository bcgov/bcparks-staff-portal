# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-feature-types.js

Imports and updates `FeatureType` records from Strapi's `park-feature-type` collection by matching the `featureTypeId` with the `strapiFeatureTypeId` on existing feature types in the DOOT database.

**The script:**

- Fetches park feature type data from Strapi using sync utilities
- Matches existing DOOT feature types by comparing Strapi `featureTypeId` with DOOT `strapiFeatureTypeId`
- Creates or updates feature type records with name and strapiFeatureTypeId
- Uses efficient Map-based lookup for fast matching between systems

**Data mapping:**

| Strapi Field      | DOOT Field            | Notes                                                        |
| ----------------- | --------------------- | ------------------------------------------------------------ |
| `parkFeatureType` | `name`                | Feature type name                                            |
| `featureTypeId`   | `strapiFeatureTypeId` | Used for matching existing records                           |
| (none)            | `icon`                | Default to `information` (?) on insert / no change on update |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park feature types from Strapi
node tasks/import-feature-types/import-feature-types.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Feature types without valid `featureTypeId` values are skipped with warnings. The script shows:

- Number of park feature types found in Strapi
- Existing `strapiFeatureTypeId` values in DOOT for debugging
- Per-record lookup results and processing status
- Final summary with counts of created, updated, and skipped records

## Why is this useful?

- **Data synchronization**: Keeps DOOT features in sync with Strapi CMS data
- **Safe operations**: Transaction-based with automatic rollback on errors
- **Idempotent**: Can be run multiple times safely without creating duplicates
- **Detailed logging**: Provides clear feedback on what was processed and any issues

## Notes

- Script assumes Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project
- Uses efficient Map-based lookup to avoid multiple database queries per record
- Only processes feature types with valid `featureTypeId` values from Strapi
- Environment variables for Strapi API access must be configured
