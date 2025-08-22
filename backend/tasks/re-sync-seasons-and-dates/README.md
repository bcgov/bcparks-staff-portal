# Re-sync All Script

This script performs a complete database re-synchronization by importing data from Strapi and JSON files and populating various tables in the correct order.

## What does the script do?

1. **Cleanup Existing Data:**

   - Deletes all records from all tables except the `User` table to preserve user accounts.
   - Uses [`delete-all.js`](./delete-all.js) to perform this cleanup. This script carefully deletes tables in the correct order to respect foreign key constraints and ensure a clean slate for re-import.

2. **Import Base Data from Strapi:**

   - Imports core entities: Feature, FeatureType, Park, ParkArea, ManagementArea, Section
   - Creates DateType definitions from configuration

3. **Populate Park Flags:**

   - Sets `hasWinterFeeDates` flags from `2025-winter-parks.json`
   - Sets `hasTier1Dates` and `hasTier2Dates` flags from `2025-tier-data.json`
   - Sets `inReservationSystem` flags for ParkArea based on Feature data

4. **Setup Access Control:**

   - Creates AccessGroup, AccessGroupPark, and UserAccessGroup relationships from `agreements-with-usernames.json`

5. **Import Gate Information:**

   - Creates GateDetail records from Strapi park-operation and park-operation-sub-area data

6. **Create Season Structure:**

   - Generates blank Season records for 2026

7. **Import Date Ranges:**

   - Imports Season and DateRange data from multiple Strapi sources
   - Imports historical dates from `previous-dates.json`

8. **Setup Annual Date Configuration:**

   - Creates DateRangeAnnual records from Strapi park-operation

9. **Transaction Safety:**
   - All operations are performed with proper error handling
   - Failed operations log errors and stop the process

## How to run

From your project root, run:

```sh
node tasks/re-sync-all/re-sync-all.js
```

## Output

The script provides detailed console logging for each step:

```
Starting: Delete all data...
Finished: Delete all data.

Starting: 1 - Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi...
Finished: 1 - Import Feature, FeatureType, Park, ParkArea, ManagementArea, Section from Strapi.

...

All re-sync 14 steps completed.
```

## Why is this useful?

- **Environment Refresh:** Completely refreshes your database with the latest data from Strapi
- **Data Consistency:** Ensures all relationships and derived data are properly synchronized
- **Development Setup:** Quickly sets up a clean development environment with current data
- **Major Updates:** Safely applies large-scale data changes across the entire system

## Prerequisites

Before running this script, ensure:

- **Database connection** is configured and accessible
- **Strapi CMS** is running and accessible
- **Required JSON files** are present:
  - `2025-winter-parks.json`
  - `2025-tier-data.json`
  - `agreements-with-usernames.json`
  - `previous-dates.json`
- **Node.js** version supports ES modules

## Notes

- **Order Dependency:** The execution order is critical - dependencies must be created before dependent data
- **Idempotent:** Safe to run multiple times; will not create duplicates
- **User Preservation:** User accounts are preserved during the cleanup process
- **Complete Reset:** Creates a fresh dataset from all source systems
- **Error Recovery:** Script can be re-run safely if it fails partway through
