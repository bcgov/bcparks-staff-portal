# create-gate-details.js

This script creates or updates `GateDetail` entries for all Parks, ParkAreas, and Features with a `publishableId` in your database, and imports gate-related data from Strapi’s `park-operation` and `park-operation-sub-area` models.


## What does the script do?

1. **For Parks:**
   - Finds all Parks with a non-null `publishableId`.
   - For each Park, creates or updates a `GateDetail` entry linked by `parkId`.
   - If the Park’s `orcs` matches a Strapi `park-operation`’s `protectedArea.orcs`, it imports the following fields from Strapi and sets them on the `GateDetail`:
     - `hasParkGate`
     - `gateOpenTime`
     - `gateCloseTime`
     - `gateOpensAtDawn`
     - `gateClosesAtDusk`
     - `gateOpen24Hours`


2. **For ParkAreas:**
   - Finds all ParkAreas with a non-null `publishableId`.
   - For each ParkArea, creates a `GateDetail` entry linked by `parkAreaId` if one does not exist.
   - (No Strapi import for ParkArea at this time.)


3. **For Features:**
   - Finds all Features with a non-null `publishableId`.
   - For each Feature, creates or updates a `GateDetail` entry linked by `featureId`.
   - If the Feature’s `strapiId` matches a Strapi `park-operation-sub-area`’s `id`, it imports the following fields from Strapi and sets them on the `GateDetail`:
     - `hasGate`
     - `gateOpenTime`
     - `gateCloseTime`
     - `gateOpensAtDawn`
     - `gateClosesAtDusk`
     - `gateOpen24Hours`

4. **Transaction Safety:**
   - All operations are performed inside a transaction. If any error occurs, all changes are rolled back.


## How to run

From your project root, run:

```sh
node backend/tasks/create-gate-details/create-gate-details.js
```


## Output

- The script logs `"GateDetail creation and import complete."` on success.
- If any error occurs, the transaction is rolled back and an error message is printed.


## Why is this useful?

- Ensures every Park, ParkArea, and Feature with a `publishableId` has a corresponding `GateDetail` entry.
- Keeps gate-related fields in sync with Strapi data for Parks and Features.
- Prevents duplicate entries and ensures data consistency.


## Notes

- The script assumes your Sequelize models and associations are set up as in the rest of the BC Parks Staff Portal project.
- You can safely run this script multiple times; it will not create duplicates and will update gate fields as needed.
- If you add new Parks, ParkAreas, Features, or update Strapi data, re-running this script will add or update any missing or changed `GateDetail` entries as needed.
