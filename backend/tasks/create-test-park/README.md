# create-test-park.js

This script creates a new Park in the database for testing purposes. The park will have:

- One Feature for every FeatureType in the DB
- A ParkArea with two Features of every FeatureType

The park and all ParkAreas and Park-level Features will also have Publishables and Dateables associated, so new Seasons can be requested.

**Transaction Safety:**

- All operations are performed inside a transaction. If any error occurs, all changes are rolled back.

## How to run

From your project root, run:

```sh
node tasks/create-test-park/create-test-park.js
```

Then, run the `create-seasons` script to request Seasons for the new Park/Features.
If you don't add Seasons, "Test Park" will not appear in the Parks table in the app.

## Output

- The script prints the ID of the new "Test Park" on success.
- If any error occurs, the transaction is rolled back and an error message is printed.

## Notes

- This script is to help with testing and debugging. It should not be run on a production environment.
- This script will create a "Test Park" record with a hardcoded ORCS code, so it will fail if you try to run it again to create multiple Test Parks.
