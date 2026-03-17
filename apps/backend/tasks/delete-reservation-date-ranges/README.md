# delete-reservation-date-ranges.js

This script deletes `DateRange` records of type "Reservation" for the 2026 operating year for features where `hasReservations` is set to `false`.

## What does the script do?

- Finds the `DateType` record with the name "Reservation".
- Finds all `Feature` records where `hasReservations` is `false`.
- For each feature, finds all reservation `DateRange` records for the 2026 operating year.
- Deletes only the reservation `DateRange` records for the 2026 season for each feature.
- All operations are performed in a database transaction for safety.

## How to run

From your project root, run:

```sh
node tasks/delete-reservation-date-ranges/delete-reservation-date-ranges.js
```

## Output

- Logs the number of deleted reservation date ranges for the 2026 season.
- If an error occurs, the transaction is rolled back and the error is logged.

## Notes

- Only affects features with `hasReservations: false`.
- Only deletes reservation date ranges for the 2026 operating year.
- Reservation date ranges from other years (2024, 2025, 2027, etc.) are preserved.
- Make sure to backup your database before running destructive scripts.
