# Strapi Data Import Scripts

This directory contains scripts for importing data from Strapi CMS into the DOOT database.

## index.js

- Syncs data from Strapi to the DOOT database
- Creates a single transaction for all import operations
- Rolls back all changes if any error occurs
- Logs progress and summary counts for each data type

## Cron Job

These scripts run automatically on a schedule via an OpenShift CronJob defined in `helm/deployment/templates/cron/strapi-sync-cronjob.yaml`.

**Schedule:** Runs daily at a configured time

## How to run

To manually trigger the sync outside of the cron schedule:

```sh
npm run cron-task
```
