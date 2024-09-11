# Backend - REST API server

This directory contains the code for the backend REST API server built with Express.

## Project structure

- `index.js`: The entry point of the server.
- `routes/`: Directory containing endpoint route handlers.
- `db/`: Directory for Sequelize models and database interactions.

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
