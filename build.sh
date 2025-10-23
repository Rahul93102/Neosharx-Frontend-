#!/bin/bash

# Clean dist directory
rm -rf dist
mkdir -p dist

# Build CSS
npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# Copy main HTML files (exclude test, backup, and old files)
for file in *.html; do
  if [[ ! "$file" =~ (test|backup|old|debug) ]]; then
    cp "$file" dist/
  fi
done

# Copy assets
cp -r assets dist/

# Copy auth folder
cp -r auth dist/

# Copy JavaScript files (exclude test files)
for file in *.js; do
  if [[ ! "$file" =~ test ]]; then
    cp "$file" dist/
  fi
done

# Copy logo and favicon
cp logo27.png dist/ 2>/dev/null || true
cp favicon.ico dist/ 2>/dev/null || true

# Copy vercel.json for deployment config
cp vercel.json dist/ 2>/dev/null || true

echo "Build completed successfully!"
