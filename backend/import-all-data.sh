#!/bin/bash

# Exit immediately if any command fails
set -e

# Run commands sequentially
npx sequelize-cli db:drop
npx sequelize-cli db:create
npm run migrate
npm run sync-data
npm run one-time-data-import
npm run create-single-item-campgrounds
npm run create-multiple-item-campgrounds

echo "All commands executed successfully."
