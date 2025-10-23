#!/bin/bash

# Clean dist directory
rm -rf dist
mkdir -p dist

# Build CSS using Tailwind
echo "Building Tailwind CSS..."
npx tailwindcss -i ./src/input.css -o ./dist/output.css --minify

# Copy regular CSS files (styles.css, auth-styles.css, etc.)
echo "Copying CSS files..."
cp *.css dist/ 2>/dev/null || true

# Copy main HTML files (exclude test, backup, and old files)
echo "Copying HTML files..."
for file in *.html; do
  if [[ ! "$file" =~ (test|backup|old|debug) ]]; then
    cp "$file" dist/
  fi
done

# Copy assets folder
echo "Copying assets..."
cp -r assets dist/

# Copy auth folder
echo "Copying auth folder..."
cp -r auth dist/

# Copy src folder (for input.css reference if needed)
echo "Copying src folder..."
cp -r src dist/ 2>/dev/null || true

# Copy JavaScript files (exclude test files)
echo "Copying JavaScript files..."
for file in *.js; do
  if [[ ! "$file" =~ test ]]; then
    cp "$file" dist/
  fi
done

# Copy logo and favicon
echo "Copying logo and favicon..."
cp logo27.png dist/ 2>/dev/null || true
cp favicon.ico dist/ 2>/dev/null || true

# Copy config files
echo "Copying config files..."
cp vercel.json dist/ 2>/dev/null || true
cp tailwind.config.js dist/ 2>/dev/null || true

# Copy markdown documentation
echo "Copying documentation..."
cp *.md dist/ 2>/dev/null || true

echo ""
echo "✓ Build completed successfully!"
echo ""
echo "Files in dist directory:"
ls -la dist/ | grep -E "\.css$|\.html$|\.js$|favicon|logo" | wc -l
echo "files copied"
