# delete-reservation-date-ranges.js

This script deletes all `DateRange` records of type "Reservation" for features where `hasReservations` is set to `false`.

## What does the script do?

- Finds the `DateType` record with the name "Reservation".
- Finds all `Feature` records where `hasReservations` is `false`.
- Deletes all `DateRange` records for those features where the `dateType` is "Reservation".
- All operations are performed in a database transaction for safety.

## How to run

From your project root, run:

```sh
node tasks/delete-reservation-date-ranges/delete-reservation-date-ranges.js
```

## Output

- Logs the number of deleted reservation date ranges.
- If an error occurs, the transaction is rolled back and the error is logged.

## Notes

- Only affects features with `hasReservations: false`.
- Make sure to backup your database before running destructive scripts.
