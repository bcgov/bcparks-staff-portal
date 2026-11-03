# Scheduled Jobs

`index.js` orchestrates the full scheduled maintenance sequence:

1. Import data from Strapi.
2. Ensure regular seasons and date ranges exist for the previous and current
   collection years.
3. Ensure winter seasons and date ranges exist for the previous and current
   collection years.
4. Ensure gate-detail records exist.
5. Queue email reminders.

Steps 1–4 run in one Sequelize transaction. If any of them fails, the
transaction is rolled back; otherwise, all changes are committed. Step 5 runs
after the commit and manages its own transactions.

## Tasks involved

The jobs run in the order above. See the [tasks README](../tasks/README.md)
for the list of individual tasks run by the cron job.

The Strapi import pipeline is implemented in
`tasks/import-strapi-data/index.js`. See its README for details about the
import-specific jobs.

## Run manually

Run the full sequence with:

```sh
npm run cron-task
```

The job is also run automatically by the OpenShift CronJob defined in
`helm/deployment/templates/cron/staff-portal-cronjob.yaml`.
