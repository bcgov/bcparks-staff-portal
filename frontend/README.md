# Frontend - React application

This directory contains the code for the frontend Staff Portal web application, built with React.

## Project structure

- `src/`: Directory containing the main application code.
- `public/`: Directory for static assets.
- `vite.config.js`: Configuration file for Vite, the build tool.

## Setup

### NOTE: FontAwesome Pro and .npmrc required to build

The frontend build process requires an access token to install the FontAwesome Pro icon kit from their private repo. This is managed using the `.npmrc` file in this directory, which configures the FontAwesome registry and uses the `FONTAWESOME_PACKAGE_TOKEN` environment variable for authentication.

**You must have the `.npmrc` file with `FONTAWESOME_PACKAGE_TOKEN` set to install dependencies.**

In development, set the token in the `frontend` Dev Container's environment by creating a `.env` file in the **repository root directory** (next to the `docker-compose.dev.yml` file, which will automatically include `.env`).

```sh
# in the repository root directory, outside of the frontend Dev container
cp .env.example .env
```

Find the token in the shared password manager vault.

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

### Running the app

#### Development

The React app runs in development mode with `Vite`. The app will automatically update with Hot Module Replacement when you save a file.

```sh
# Start the dev server with HMR
npm run dev
```

### Code formatting

The Dev Container is configured with Prettier and ESLint. Code will be automatically formatted on save.

To manually run ESLint and list warnings and errors:

```sh
npm run lint
```

To manually run Prettier and apply formatting changes to all files:

```sh
npx prettier . --write
```
