#!/bin/bash

echo "Starting Agri-Connect Development Environment..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    pnpm install
    echo
fi

# Copy environment files if they don't exist
if [ ! -f "packages/api/.env" ]; then
    echo "Setting up API environment..."
    cp packages/api/.env.example packages/api/.env
fi

if [ ! -f "apps/web/.env" ]; then
    echo "Setting up Web environment..."
    cp apps/web/.env.example apps/web/.env
fi

# Generate Prisma client and setup database
echo "Setting up database..."
cd packages/api
pnpm prisma generate
pnpm prisma db push
pnpm db:seed
cd ../..

echo
echo "Starting all services..."
echo "- API Server: http://localhost:8080"
echo "- Web App: http://localhost:5173"
echo "- Mobile App: Expo DevTools will open"
echo

# Start all services in parallel
pnpm dev
