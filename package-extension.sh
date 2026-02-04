#!/bin/bash

# Build and package extension for Chrome Web Store submission

echo "📦 Building extension for production..."

# Clean and build
npm run build

# Create package
echo "🗜️  Creating ZIP package..."
cd dist
zip -r ../shopee-stats-extension.zip . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo "✅ Package created: shopee-stats-extension.zip"
echo "📊 Package size:"
ls -lh shopee-stats-extension.zip
echo ""
echo "🚀 Ready to upload to Chrome Web Store!"
echo "📋 Next steps:"
echo "   1. Go to https://chrome.google.com/webstore/devconsole"
echo "   2. Create new item"
echo "   3. Upload shopee-stats-extension.zip"
