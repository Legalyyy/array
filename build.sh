#!/bin/bash
# Build script for the bot project

echo "🔨 Building project..."

# Create dist directory structure
mkdir -p dist/client

# Copy static client files
echo "📦 Copying client files..."
cp -r client/* dist/client/

# Build server with esbuild
echo "⚙️  Building server..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Build complete!"
echo "📁 Output directory: dist/"
