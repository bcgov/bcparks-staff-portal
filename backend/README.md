# Backend - REST API server

This directory contains the code for the backend REST API server built with Express.

## Project structure

- `index.js`: The entry point of the server.
- `routes/`: Directory containing endpoint route handlers. The API endpoints are inside the `api/` directory.
- `db/`: directory that contains DB connection and config
- `models/`: Directory for Sequelize models.
- `migrations/`: list of DB migrations. Each file represents a change to the DB schema. The name of the file starts with a timestamp. So that they are sorted by the time they were created.
-

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

#### create a migration

run the command `npx sequelize-cli migration:generate --name my-migration-name` in the container. A file will be created inside the migrations folder. Inside that file you will see 2 methods.

- `up(queryInterface, Sequelize)`: here you add the changes you want to make to the DB
- `down(queryInterface, Sequelize)`: here you add how you would undo the changes.

#### Run migrations

Only creating the files will not apply the change to the DB. You have to run the migrations.
After you're done editing the migration file, run `npm run migrate` to apply the changes.
Sequelize will keep track of which migration have been run.

### Adding data to the DB

You can add seed data inside the `seeders/` directory.
To add a new seed file, you can run `npx sequelize-cli seed:generate --name seed-name`
Then, you can run them by running the command `npx sequelize-cli db:seed:all`

The seed data can be useful if you want to test something specific. However, we can directly import the data from Strapi and test with real data.

To add the data from Strapi:

1. Make sure that you have run all the migrations `npm run migrate`
2. Run `npm run sync-data` command.
3. Run `npm run one-time-data-import`. Make you only run this one time.
4. Run `npm run create-single-item-campgrounds`. Make you only run this one time.
5. Run `npm run create-multiple-item-campgrounds`. Make you only run this one time.
6. Go to the admin dashboard and create a user `http://localhost:8100/admin/login`

If for some reason, there is something wrong with the data in the DB and the app becomes unusable.
Just recreate the DB and readd the data from Strapi.

1. `npx sequelize-cli db:drop `
2. `npx sequelize-cli db:create`
3. `npm run migrate`
4. `npm run sync-data`
5. `npm run one-time-data-import`
6. `npm run create-single-item-campgrounds`
7. `npm run create-multiple-item-campgrounds`
