#!/bin/sh
set -e

echo "Running migrations..."
npm run migrate

# Start the backend server
echo "Done. Starting the Express server..."
npm run start
