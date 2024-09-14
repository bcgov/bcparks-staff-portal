# Frontend - React application

This directory contains the code for the frontend Staff Portal web application, built with React.

## Project structure

- `src/`: Directory containing the main application code.
- `public/`: Directory for static assets.
- `vite.config.js`: Configuration file for Vite, the build tool.

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

### Running the app

#### Development

The React app runs in development mode with `Vite`. The app will automatically update with Hot Module Replacement when you save a file.

```sh
# Start the dev server with HMR
npm run dev
```

### Code formatting

The Dev Container is configured with Prettier and ESLint. Code will be automatically formatted on save.
