# populate-in-reservation-system.js

This script populates the `inReservationSystem` field on each `ParkArea` based on the values of its child `Feature` records.

## What does the script do?

1. **For each ParkArea:**

   - Fetches all child `Feature` records.

2. **Logic for setting `inReservationSystem`:**

   - If **any** child `Feature` has `inReservationSystem === true`, sets the parent `ParkArea.inReservationSystem` to `true`.
   - If **all** child `Feature` records have `inReservationSystem === false`, sets the parent to `false`.
   - If there are **no child features**, the script skips that `ParkArea`.
   - If all child features are `null`/`undefined`, the script skips updating that `ParkArea`.

3. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/populate-in-reservation-system/populate-in-reservation-system.js
```

## Output

- The script logs each `ParkArea` that was updated, e.g.:
  ```
  Updated ParkArea id=123 inReservationSystem=true
  ```
- On success, logs:
  ```
  Finished. Updated X ParkAreas.
  ```
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures every `ParkArea`'s `inReservationSystem` field accurately reflects the reservation status of its child features.
- Keeps your database consistent and up-to-date with the actual reservation system status of features.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will only update `ParkArea` records where the value needs to change.
- If you add new Features or update their `inReservationSystem` status, re-running this script will update the parent `ParkArea` as needed.
