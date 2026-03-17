#!/bin/sh
set -e

MODE="$1"

# Handle local dev volume mount structure vs Openshift volume structure
if [ -d "/app/backend" ]; then
  cd /app/backend
fi

echo "Running migrations..."
npm run migrate

# Run the cron task if specified
if [ "$MODE" = "cron" ]; then
  echo "Done. Running cron task..."
  npm run cron-task
  echo "Cron task complete."
  exit 0
fi

# Start the backend server
echo "Done. Starting the Express server..."
npm run start
