# update-orcs-area-numbers.js

This script synchronizes ORCS area numbers from Strapi to the local DOOT database by updating the `strapiOrcsAreaNumber` field in the `ParkAreas` table.

## This script is temporary

When DOOT's Strapi sync scripts are updated, these values will be fetched during normal sync operations, making this script unnecessary. When we have a script to create and update ParkArea records in the `/tasks` directory using the `park-areas` Strapi collection, we can delete this temporary script.

## What does the script do?

1. **Fetches all park areas from Strapi** using `/api/park-areas` endpoint
2. **Updates local ParkArea records** by matching `Park.orcs` and `ParkAreas.name` and updating `strapiOrcsAreaNumber`
3. **Transaction Safety** - all operations in a transaction, rolled back on error

## How to run

```sh
node tasks/update-orcs-area-numbers/update-orcs-area-numbers.js
```

## Requirements

- Valid `STRAPI_URL` and `STRAPI_TOKEN` environment variables
- Accessible Strapi API with park areas data

## Output

- Logs progress for each page fetched
- Reports: `"Updated X parkAreas with strapiOrcsAreaNumber"`
- Errors cause transaction rollback with error message

## Notes

- 1-second delay between API requests to avoid overwhelming Strapi
- Skips records where ORCS area number hasn't changed
- Safe to run multiple times
- Uses `Park.orcs` and `ParkAreas.name` fields for matching
