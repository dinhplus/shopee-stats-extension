#!/bin/bash

# Build script for Shopee Stats Extension

echo "🚀 Building Shopee Stats Extension..."

# Run TypeScript compilation and Vite build (with patching)
npm run build

echo "✅ Build completed! Extension files are in ./dist folder"
echo "📋 To load the extension:"
echo "   1. Open chrome://extensions/"
echo "   2. Enable 'Developer mode'"
echo "   3. Click 'Load unpacked'"
echo "   4. Select the ./dist folder"
