# import-sections.js

Imports and updates `Section` records from Strapi's `section` collection by matching the `sectionNumber` with existing sections in the DOOT database.

**The script:**

- Fetches section data from Strapi using sync utilities
- Matches existing DOOT sections by comparing Strapi `sectionNumber` with DOOT `sectionNumber`
- Creates or updates section records with data mapped in the table below

**Data mapping:**

| Strapi Field    | DOOT Field      | Notes          |
| --------------- | --------------- | -------------- |
| `sectionName`   | `name`          | Section name   |
| `sectionNumber` | `sectionNumber` | Well known key |

## Transaction Safety

All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
# Import sections from Strapi
node strapi-sync/import-sections/import-sections.js
```

## Output

The script logs progress and provides summary counts of created, updated, and skipped records. Sections without valid `sectionNumber` values are skipped with warnings. The script shows:

- Number of sections found in Strapi
- Number of existing sections in DOOT
- Per-record lookup results and processing status
- Final summary with counts of created, updated, skipped and unchanged records
