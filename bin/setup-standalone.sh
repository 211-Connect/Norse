#!/bin/sh

# Ensure the standalone directory exists
mkdir -p .next/standalone

# Copy public folder if it exists
if [ -d "public" ]; then
  cp -R public .next/standalone/public
fi

# Copy .next/static folder if it exists
if [ -d ".next/static" ]; then
  mkdir -p .next/standalone/.next/static
  cp -R .next/static .next/standalone/.next/static
fi

echo "Standalone setup complete: Static assets copied."
