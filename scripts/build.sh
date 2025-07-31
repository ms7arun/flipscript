#!/bin/bash

# Build script for flipscript Chrome Extension

echo "🚀 Building flipscript Chrome Extension..."

# Clean previous build
rm -rf dist

# Build with Vite
echo "📦 Building with Vite..."
npx vite build

# Fix file structure for Chrome extension
echo "🔧 Fixing file structure..."
mv dist/src/popup/index.html dist/popup.html
rm -rf dist/src

# Copy required files
echo "📋 Copying required files..."
cp -r icons dist/
cp manifest.json dist/

echo "✅ Build completed! Extension files are in the dist/ folder"
echo "📁 To load in Chrome:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable Developer mode"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the dist/ folder" 