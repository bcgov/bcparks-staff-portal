# update-orcs-feature-numbers.js

This script synchronizes ORCS feature numbers from Strapi to the local DOOT database by updating the `strapiOrcsFeatureNumber` field in the `Features` table.

## This script is temporary

When DOOT's Strapi sync scripts are updated, these values will be fetched during normal sync operations, making this script unnecessary. When we have a script to create and update Feature records in the `/tasks` directory using the `park-features` Strapi collection, we can delete this temporary script.

## What does the script do?

1. **Fetches all park features from Strapi** using `/api/park-features` endpoint
2. **Handles duplicate featureIds** - skips any `featureId` values that occur more than once to avoid data conflicts
3. **Updates local Feature records** by matching `strapiFeatureId` and updating `strapiOrcsFeatureNumber`
4. **Transaction Safety** - all operations in a transaction, rolled back on error

## How to run

```sh
node tasks/update-orcs-feature-numbers/update-orcs-feature-numbers.js
```

## Requirements

- Valid `STRAPI_URL` and `STRAPI_TOKEN` environment variables
- Accessible Strapi API with park features data

## Output

- Logs progress for each page fetched
- Reports: `"Updated X features with strapiOrcsFeatureNumber"`
- Errors cause transaction rollback with error message

## Notes

- 1-second delay between API requests to avoid overwhelming Strapi
- Skips records where ORCS feature number hasn't changed
- Safe to run multiple times
- Uses `strapiFeatureId` field for matching
