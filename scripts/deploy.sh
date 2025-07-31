#!/bin/bash

# Build and package Chrome extension
echo "Building Chrome extension..."

# Clean previous build
rm -rf dist/
rm -f flipscript-*.zip

# Install dependencies
npm install

# Build the extension
npm run build

# Create deployment package
echo "Creating deployment package..."
cd dist/
zip -r ../flipscript-v1.0.0.zip .
cd ..

echo "✅ Build complete! Extension package: flipscript-v1.0.0.zip"
echo "📦 Ready for Chrome Web Store submission" 