# Strapi Data Import

This directory contains the Strapi-to-DOOT import jobs. The import pipeline is
defined here, while the full scheduled job is orchestrated by `cron/index.js`.

## Import Pipeline

`index.js` exports `syncStrapiData(transaction)`, which runs the individual
Strapi importers for sections, management areas, date types, parks, park-area
types, park areas, feature types, and features.

## Imported Data

Each importer matches Strapi records to existing DOOT records using a stable
identifier, then creates or updates the local record:

| Strapi type         | DOOT model       | DOOT matchedBy         | Strapi matchedBy       |
| ------------------- | ---------------- | ---------------------- | ---------------------- |
| `section`           | `Section`        | `sectionNumber`        | `sectionNumber`        |
| `management-area`   | `ManagementArea` | `managementAreaNumber` | `managementAreaNumber` |
| `park-date-type`    | `DateType`       | `dateTypeNumber`       | `dateTypeId`           |
| `protected-area`    | `Park`           | `orcs`                 | `orcs`                 |
| `park-area-type`    | `ParkAreaType`   | `parkAreaTypeNumber`   | `areaTypeId`           |
| `park-area`         | `ParkArea`       | `orcsAreaNumber`       | `orcsAreaNumber`       |
| `park-feature-type` | `FeatureType`    | `featureTypeNumber`    | `featureTypeId`        |
| `park-feature`      | `Feature`        | `orcsFeatureNumber`    | `orcsFeatureNumber`    |

It can also be run directly to execute only the Strapi import pipeline:

```sh
node tasks/import-strapi-data/index.js
```

## Full Scheduled Job

See [`cron/README.md`](../../cron/README.md) for the full scheduled sequence,
transaction behavior, and manual execution instructions.
