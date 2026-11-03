# Local database setup

How to load realistic data into your local Dev Container environment by restoring a copy of the production database. Use these steps for both:

- **Initial setup:** your local database is new and empty.
- **Refreshing from prod:** your local database already has data, which these steps replace.

> **Production data is sensitive.** Never commit it. The steps below stream it straight into your local database, so no backup file is created.

Local database defaults (name, user, password, port) are defined in [docker-compose.dev.yml](../docker-compose.dev.yml). The backend database is exposed on the host at port `8102`.

## Before you start

- **Initial setup:** Complete the [backend Setup](./README.md#setup) first: open the `backend` Dev Container (which also starts the `db` container), run `npm install`, and create `.env.local`. The steps below need the `db` container running.
- **Refreshing:** Everything in your local database is lost. To keep it, save a [snapshot](#saving-a-snapshot) first.

## 1. Reset the local database

With the local `db` container running, run these from your host terminal to drop and recreate the database. On initial setup this just recreates the empty database.

```sh
docker exec bcparks-staff-portal-db-1 psql -U user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='mydatabase' AND pid <> pg_backend_pid();"
docker exec bcparks-staff-portal-db-1 psql -U user -d postgres -c "DROP DATABASE IF EXISTS mydatabase;"
docker exec bcparks-staff-portal-db-1 psql -U user -d postgres -c "CREATE DATABASE mydatabase OWNER \"user\";"
```

## 2. Copy production into it

Requires access to the production OpenShift project (`a7dd13-prod`, not dev, test, or tools) and the [`oc` CLI](https://docs.openshift.com/container-platform/latest/cli_reference/openshift_cli/getting-started-cli.html). See [Crunchy Postgres backup and restore](../docs/crunchy-postgres-backup-and-restore.md) for how the production cluster is set up.

1. Log in with `oc` (in the OpenShift web console, your name in the top right → **Copy login command**).
2. Find the primary Postgres pod:

   ```sh
   oc get pods -n a7dd13-prod -l postgres-operator.crunchydata.com/role=master
   ```

3. Stream a dump from that pod straight into the local database:

   ```sh
   oc exec -n a7dd13-prod <pod> -c database -- pg_dump --no-owner --no-privileges crunchy-postgres \
     | docker exec -i bcparks-staff-portal-db-1 psql -U user -d mydatabase
   ```

   If the restore pauses, press Enter. If the stream is interrupted, repeat step 1 and rerun this command.

To keep a reusable copy instead, redirect the dump to a file (`> doot-backup.sql`) and load it later with `docker exec -i bcparks-staff-portal-db-1 psql -U user -d mydatabase < ./doot-backup.sql`. Keep that file outside the repository and delete it when you're done.

## 3. Bring the database up to date

Run these in the Dev Container's `backend` directory, or from your host terminal by prefixing each with `docker compose exec backend`:

```sh
# Apply any migrations newer than the production schema
npm run migrate

# Run the scheduled jobs: Strapi import, season creation, and so on
npm run cron-task
```

`npm run cron-task` imports data from Strapi, so Strapi must be running locally first, with an API token created for it. Set `STRAPI_TOKEN` to that token and `STRAPI_URL` to the Strapi address in `.env.local` (the example file defaults `STRAPI_URL` to `http://host.docker.internal:1337`). See the [Strapi development README](https://github.com/bcgov/bcparks.ca/blob/main/src/cms/README.md) for running Strapi locally. See the [cron README](./cron/README.md) for what the job does.

## 4. Check the result

- Sign in to the AdminJS dashboard at <http://localhost:8100/admin/login>.
- To browse the database, connect any Postgres client (such as DBeaver) to `localhost`, port `8102`, using the database, user, and password from [docker-compose.dev.yml](../docker-compose.dev.yml).

## Saving a snapshot

After any post-restore setup, you can save a copy of your local database so you can restore it again later:

```sh
docker exec bcparks-staff-portal-db-1 pg_dump -U user --no-owner --no-privileges mydatabase > snapshot.sql
```
