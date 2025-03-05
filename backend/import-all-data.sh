#!/bin/bash

# Exit immediately if any command fails
set -e

# Run commands sequentially
npx sequelize-cli db:drop
npx sequelize-cli db:create
npm run migrate

npm run import-data

echo "All commands executed successfully."
