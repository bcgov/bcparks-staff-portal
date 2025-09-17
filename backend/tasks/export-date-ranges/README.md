# export-date-ranges.js

This script migrates published date ranges from the BC Parks staff portal database to the Strapi CMS `/api/park-dates` endpoint.

## What does the script do?

1. **Fetches published date ranges**
   - Queries the database for all `DateRange` entries linked to published `Season` records.
   - Includes related data: `DateType`, `DateRangeAnnual`, `Park`, `Feature`, and `Season`.

2. **Transforms the data**
   - Converts each date range into the format expected by Strapi, including:
     - `isActive`
     - `isDateRangeAnnual`
     - `operatingYear`
     - `startDate` / `endDate` (YYYY-MM-DD)
     - `parkDateType`
     - `protectedArea` (Park ORCS)
     - `parkFeature` (Strapi feature ID)
     - `adminNote`

3. **Posts each date range to Strapi**
   - Sends each transformed record to the `/api/park-dates` endpoint using the Strapi API client.

## How to run

From your project root, run:

```sh
node tasks/export-date-ranges/export-date-ranges.js
```

## Output

- Logs each date range as it is processed.
- Creates new records in Strapi for each valid date range.
- Errors are logged but do not stop the migration.

## Why is this useful?

- Migrates historical and current park date information to Strapi for centralized management.
- Ensures all published date ranges are available in the Strapi CMS.
- Prevents duplicate entries by only processing published seasons and valid date ranges.

## Notes

- This is a **one-time migration script**. Run it only once to avoid duplicate records in Strapi.
- Only processes seasons with `status: "published"`.
- Requires valid park ORCS numbers and feature Strapi IDs.
- Date ranges must have both start and end dates.
- If you encounter errors, check your database connection, Strapi API status, and data
