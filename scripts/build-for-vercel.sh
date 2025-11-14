#!/bin/bash
set -e

echo "Building @my-monorepo/types package first..."
cd packages/types
pnpm build
cd ../..

echo "Building web app..."
pnpm build:web

echo "Build complete!"

