# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## import-features.js

Imports and updates `Feature` records from Strapi's `park-feature` collection by matching the `orcsFeatureNumber` with existing features in the DOOT database.

**The script:**

- Fetches park feature data from Strapi using sync utilities
- Matches existing DOOT features by comparing Strapi `orcsFeatureNumber` with DOOT `strapiOrcsFeatureNumber`
- Sets the `parkId` field in DOOT Feature by matching Strapi `protectedArea.orcs` to DOOT `park.orcs`
- Sets the `featureTypeId` relation by matching Strapi `parkFeature.featureTypeId` to DOOT `featureType.strapiId`.
- Sets the `parkAreaId` relation by matching Strapi `parkArea.orcsAreaNumber` to DOOT `parkArea.strapiOrcsAreaNumber`.
- Creates or updates feature records with name, active status, reservation system flags, and park relation
- Uses efficient Map-based lookup for fast matching between systems

**Data mapping:**

| Strapi Field                    | DOOT Field                | Notes                                        |
| ------------------------------- | ------------------------- | -------------------------------------------- |
| `parkFeatureName`               | `name`                    | Feature name                                 |
| `orcsFeatureNumber`             | `strapiOrcsFeatureNumber` | Used for matching existing records           |
| `isActive`                      | `active`                  | Defaults to `true` if not provided           |
| `inReservationSystem`           | `inReservationSystem`     | Defaults to `false` if not provided          |
| `hasReservations`               | `hasReservations`         | Defaults to `false` if not provided          |
| `hasBackcountryPermits`         | `hasBackcountryPermits`   | Defaults to `false` if not provided          |
| `parkFeatureType.featureTypeId` | `featureTypeId`           | DOOT Feature Type, matched by well-known key |
| `protectedArea.orcs`            | `parkId`                  | DOOT Park, matched by well-known key         |
| `parkArea.orcsAreaNumber`       | `parkAreaId`              | DOOT Park Area, matched by well-known key    |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import park features from Strapi
node tasks/import-features/import-features.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Features without valid `orcsFeatureNumber` values or without a matching DOOT Park for `parkId` are skipped with warnings. The script shows:

- Number of park features found in Strapi
- Existing `strapiOrcsFeatureNumber` values in DOOT for debugging
- Existing DOOT Park ORCS values for parkId matching
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
- Only processes features with valid `orcsFeatureNumber` values from Strapi
- Converts integer `orcsFeatureNumber` to string for consistent database field matching
- Only sets `parkId` if a matching DOOT Park exists for the Strapi `protectedArea.orcs` value
- Environment variables for Strapi API access must be configured
