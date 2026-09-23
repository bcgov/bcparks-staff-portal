# Backend - REST API server

This directory contains the code for the backend REST API server built with Express.

## Project structure

- `index.js`: Express server entry point and AdminJS route registration.
- `routes/`: HTTP route handlers, including the public API under `routes/api/`.
- `middleware/`: Express middleware, authentication, permissions, user handling, and AdminJS configuration.
- `components/`: Custom React components used by AdminJS for editing and displaying JSON and other specialized fields.
- `models/`: Sequelize model definitions and associations.
- `migrations/`: Timestamped Sequelize migrations that create and modify the database schema.
- `db/`: Database connection and Sequelize configuration.
- `constants/`: Shared application constants, including season statuses, types, feature types, and user roles.
- `cron/`: Scheduled-job orchestration. Runs the Strapi import and follow-up season and gate-detail jobs in one transaction.
- `tasks/`: Standalone data-maintenance and batch jobs, including Strapi imports, season creation, date-range population, and access-group updates.
- `utils/`: Reusable application helpers, including email notifications, data access, season logic, task queues, and save utilities.

## Setup

### Development environment

This workspace is set up to open in a Dev Container. All necessary dependencies, including Node.js, are pre-installed in the container. See the [README in root workspace](../README.md) for details about the Dev Containers workflow.

### Installation

Inside the dev container, install the project dependencies with `npm`:

```sh
npm install
```

Create a `.env` file to set environment variables for local development.

```sh
# Create ".env.local"
# and refer to .env.example and the shared vault in your password manager
cp .env.example .env.local
```

### Running the server

#### Development

The Express server runs in development mode with `nodemon`. The server will automatically restart when you save a file.

```sh
# Start the server with nodemon
npm run dev
```

To manually restart the `nodemon` process, type `rs<enter>` in the terminal. (Or stop it with `CTRL+C` and run `npm run dev` again.)

### Code formatting

The Dev Container is configured with Prettier and ESLint. Code will be automatically formatted on save.

### DB migrations

Migrations are files that keep track of the changes we make to the DB schema.

#### Create a migration

run the command `npx sequelize-cli migration:generate --name my-migration-name` in the container. A file will be created inside the migrations folder. Inside that file you will see 2 methods.

- `up(queryInterface, Sequelize)`: here you add the changes you want to make to the DB
- `down(queryInterface, Sequelize)`: here you add how you would undo the changes.

#### Run migrations

Only creating the files will not apply the change to the DB. You have to run the migrations.
After you're done editing the migration file, run `npm run migrate` to apply the changes.
Sequelize will keep track of which migration have been run.

### Adding data to the DB

For realistic local development data, restore both databases from production
backups before running the application:

Follow the team Confluence instructions titled **"Copying prod data to Docker
Desktop"**. These instructions are the preferred procedure for restoring both
the local Docker Postgres database used by the backend and the local Strapi
database.

For additional Strapi development context, see the [Strapi development
README](https://github.com/bcgov/bcparks.ca/blob/main/src/cms/README.md).

After restoring both databases, configure the local environment to connect to
the restored Strapi instance and database, then verify the `STRAPI_URL` and
`STRAPI_TOKEN` values. Run any pending backend migrations with
`npm run migrate`.

Use the team's approved backup and restore procedure for the database engines
and environments involved. Do not commit backup files or production
credentials to the repository.

After the restores and migrations are complete, run the Strapi import and
other one-time setup tasks required for the local environment. See the
[Strapi import README](./tasks/import-strapi-data/README.md) for the import
pipeline and [cron README](./cron/README.md) for the full scheduled job.

Sign in to the AdminJS dashboard using the credentials configured in `.env.local`.

Do not commit `.env.local` or share the configured password.

`http://localhost:8100/admin/login`

### Creating new seasons

Add blank seasons for new operating years with the `create-seasons` NPM script:

```bash
# Example: create seasons for 2028
# (This will also create Group Camping seasons for the next year, 2029)
npm run create-seasons 2028
```

This will create new records in the Seasons table for all Parks, ParkAreas, and Features that will be requesting dates for the 2028 operating year. Group Campground features for the year after (2029) will also be requested by this script.
