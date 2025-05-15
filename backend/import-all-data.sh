#!/bin/bash

# Exit immediately if any command fails
set -e

# This script drops the DB and re-imports all data from Strapi.
# NOTE: While DOOT v2 is in development, we need to run migrations and import data in a specific order.
# This is temporary until the DOOT v2 data model is finalized and the import and sync scripts are updated.

npx sequelize-cli db:drop
npx sequelize-cli db:create

# Run DOOT v1 migrations, and v2 migrations up to the point where update the Season model.
npm run migrate -- --to 20250510014335-add-season-type.js

# Import data from Strapi
npm run import-data

# Run DOOT v2 migrations to migrate old seasons to use the new publishables field.
# Undo and re-run the add-season-type migration to migrate the imported data.
npx sequelize-cli db:migrate:undo
npx sequelize-cli db:migrate

echo "All commands executed successfully."
