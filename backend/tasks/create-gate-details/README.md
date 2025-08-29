# create-gate-details.js

This script creates or updates `GateDetail` entries for all Parks, ParkAreas, and Features in your database, and imports gate-related data from Strapi’s `park-operation` and `park-operation-sub-area` models.

## What does the script do?

1. **For Parks:**

   - Finds all Parks with a non-null `publishableId`.
   - For each Park, creates or updates a `GateDetail` entry linked by `publishableId`.
   - If the Park’s `orcs` matches a Strapi `park-operation`’s `protectedArea.orcs`, it imports the following fields from Strapi and sets them on the `GateDetail`:
     - `hasParkGate`
     - `gateOpenTime`
     - `gateCloseTime`
     - `gateOpensAtDawn`
     - `gateClosesAtDusk`
     - `gateOpen24Hours`

2. **For ParkAreas and Features:**

- Finds all Features (with or without `publishableId`)
- For each Feature, determines the target `publishableId`:
  - Uses the Feature's own `publishableId` if it exists
  - **OR** uses the parent ParkArea's `publishableId` if the Feature belongs to a ParkArea
- Creates or updates a `GateDetail` entry for the target `publishableId`
- Matches Features to Strapi `park-operation-sub-area` data by:
  1. **ParkArea name** (if Feature belongs to a ParkArea)
  2. **Feature name**
  3. **Feature strapiId**
- If a match is found, imports the following fields:
  - `hasGate`
  - `gateOpenTime`
  - `gateCloseTime`
  - `gateOpensAtDawn`
  - `gateClosesAtDusk`
  - `gateOpen24Hours`


3. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/create-gate-details/create-gate-details.js
```

## Output

- The script logs `"GateDetail creation and import complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Why is this useful?

- Ensures Park, ParkArea, and Feature has a corresponding `GateDetail` entry.
- Keeps gate-related fields in sync with Strapi data for Parks, ParkAreas, and Features.
- Prevents duplicate entries and ensures data consistency.

## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update gate fields as needed.
- If you add new Parks, ParkAreas, Features, or update Strapi data, re-running this script will add or update any missing or changed `GateDetail` entries as needed.
