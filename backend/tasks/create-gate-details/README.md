# create-gate-details.js

This script creates missing `GateDetail` entries for all Parks, ParkAreas, and Features in your database.

## What does the script do?

1. **For Parks:**
   - Finds all Parks with a non-null `publishableId`.
   - For each Park, creates a `GateDetail` entry linked by `publishableId` only if one does not already exist.

2. **For ParkAreas and Features:**

- Finds all Features (with or without `publishableId`)
- For each Feature, determines the target `publishableId`:
  - Uses the parent ParkArea's `publishableId` if the Feature belongs to a ParkArea
  - Otherwise uses the Feature's own `publishableId`
- Creates a `GateDetail` entry for the target `publishableId` only if one does not already exist

3. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

```sh
node tasks/create-gate-details/create-gate-details.js
```

## Output

- The script logs `"GateDetail creation complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures Park, ParkArea, and Feature has a corresponding `GateDetail` entry.
- Prevents duplicate entries and ensures data consistency.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and only creates missing `GateDetail` entries.
- If you add new Parks, ParkAreas, or Features, re-running this script will create any missing `GateDetail` entries.
