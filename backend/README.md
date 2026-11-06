# Backend - REST API server

This directory contains the code for the backend REST API server built with Express.

## Project structure

- `index.js`: Express server entry point and AdminJS route registration.
- `routes/`: Express route handlers that define the API endpoints.
- `middleware/`: Express middleware, authentication, permissions, user handling, and AdminJS configuration.
- `components/`: Custom React components used by AdminJS for editing and displaying JSON and other specialized fields.
- `models/`: Sequelize model definitions and associations.
- `migrations/`: Timestamped Sequelize migrations that create and modify the database schema.
- `db/`: Database connection and Sequelize configuration.
- `constants/`: Shared application constants, including season statuses, types, feature types, and user roles.
- `cron/`: Scheduled jobs that keep the data up to date. See the [cron README](./cron/README.md).
- `tasks/`: Standalone data-maintenance and batch jobs. See the [tasks README](./tasks/README.md).
- `utils/`: Shared helper functions used by routes, tasks, and scheduled jobs.

## Setup

### Development environment

This workspace is set up to open in a Dev Container. All necessary dependencies, including Node.js, are pre-installed in the container. See the [README in root workspace](../README.md) for details about the Dev Containers workflow.

### Installation

Inside the dev container, install the project dependencies with `npm`:

```sh
npm install
```

Create a `.env.local` file to set environment variables for local development.

```sh
# Refer to .env.local.example and the shared vault in your password manager
cp .env.local.example .env.local
```

### Running the server

#### Development

The Express server runs in development mode with `nodemon`. The server will automatically restart when you save a file.

```sh
# Start the server with nodemon
npm run dev
```

The server listens on port `8100` (`http://localhost:8100`).

### Code formatting

Code is formatted with Prettier on save in the Dev Container. Lint with ESLint by running `npm run lint`.

### Testing

Tests use [Vitest](https://vitest.dev/):

```sh
npm test               # run the full suite once
npm run test:watch     # re-run affected tests on file changes
npm run test:coverage  # run once with a coverage report
```

See [TESTING.md](./TESTING.md) for details on running individual tests and writing new ones.

### DB migrations

Migrations are Sequelize files in `migrations/` that track changes to the DB schema.

```sh
# Create a new migration file in migrations/
npx sequelize-cli migration:generate --name my-migration-name

# Apply pending migrations
npm run migrate
```

Fill in the `up` method with the schema change and the `down` method with how to undo it. Creating the file does not change the DB until you run `npm run migrate`.

### Adding data to the DB

To load realistic local data, restore a copy of the production database. Use this for initial setup and to refresh from prod. See [DATABASE.md](./DATABASE.md) for the full steps, including `npm run migrate` and `npm run cron-task` (which needs Strapi running locally with an API token).

Sign in to the AdminJS dashboard at `http://localhost:8100/admin/login` with `ADMIN_USER` and `ADMIN_PASSWORD` from `.env.local`. Do not commit `.env.local` or any production data.
