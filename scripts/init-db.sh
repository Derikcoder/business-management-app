#!/bin/bash

# Initialize database for production
echo "Initializing database..."

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push --accept-data-loss

echo "Database initialization complete!"
