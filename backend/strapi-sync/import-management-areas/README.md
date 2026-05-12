# import-management-areas.js

Imports and updates `ManagementArea` records from Strapi's `management-area` collection by matching the `managementAreaNumber` with existing management areas in the DOOT database.

**The script:**

- Fetches management area data from Strapi using sync utilities
- Resolves the section foreign key by matching Strapi `section.sectionNumber` with DOOT section records
- Matches existing DOOT management areas by comparing Strapi `managementAreaNumber` with DOOT `managementAreaNumber`
- Creates or updates management area records with data mapped in the table below

**Data mapping:**

| Strapi Field            | DOOT Field             | Notes                                |
| ----------------------- | ---------------------- | ------------------------------------ |
| `managementAreaName`    | `name`                 | Management area name                 |
| `managementAreaNumber`  | `managementAreaNumber` | Well known key                       |
| `section.sectionNumber` | `sectionId`            | Foreign key lookup by section number |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import management areas from Strapi
node strapi-sync/import-management-areas/import-management-areas.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Management areas without valid `managementAreaNumber` values are skipped with warnings. Management areas with missing or unmatched sections are logged with detailed warnings. The script shows:

- Number of management areas found in Strapi
- Number of existing management areas in DOOT
- Per-record section lookup results and warnings
- Per-record processing status
- Final summary with counts of created, updated, skipped and unchanged records
