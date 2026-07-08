#!/bin/sh
set -e
echo "[mealio] Pushing database schema..."
node ./node_modules/prisma/build/index.js db push --schema /app/prisma/schema.prisma --accept-data-loss
echo "[mealio] Starting server on port ${PORT:-3015}..."
exec node server.js
