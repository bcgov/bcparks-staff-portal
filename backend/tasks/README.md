# Tasks

Standalone data-maintenance and batch jobs. Each task has its own README with usage details. Run them from the `backend` directory with `node tasks/<task>/<script>.js`, or with the `npm run` scripts where one exists.

## Run by the cron job

These run as part of the scheduled job in [cron](../cron/README.md) (`npm run cron-task`), in the order listed below, and can also be run manually. All but the email reminders run in one transaction; the email reminders run afterward.

| Task                                                       | Purpose                                                                                            |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [import-strapi-data](./import-strapi-data/README.md)       | Imports Strapi data into the database. _`index.js` runs the importers in the subfolders in order._ |
| [create-seasons](./create-seasons/README.md)               | Creates Seasons and date ranges for an operating year (`npm run create-seasons`).                  |
| [populate-date-ranges](./populate-date-ranges/README.md)   | Populates annual and blank date ranges for new operating years. _Called by `create-seasons`._      |
| [create-winter-seasons](./create-winter-seasons/README.md) | Creates Winter seasons and placeholder fee date ranges (`npm run create-winter-seasons`).          |
| [create-gate-details](./create-gate-details/README.md)     | Creates missing `GateDetail` records for Parks, ParkAreas, and Features.                           |
| [queue-email-reminders](./queue-email-reminders/README.md) | Queues emails for pending reminders that are due.                                                  |

## Run manually only

| Task                                                                         | Purpose                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [create-test-park](./create-test-park/README.md)                             | Creates a test Park with Features and ParkAreas of every FeatureType. |
| [delete-reservation-date-ranges](./delete-reservation-date-ranges/README.md) | Deletes Reservation date ranges for Features without reservations.    |
| [fix-orphaned-dateranges](./fix-orphaned-dateranges/README.md)               | Fixes date ranges attached to incorrect Seasons.                      |
