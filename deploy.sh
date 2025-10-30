#!/bin/bash

# Production Deployment Script for Discord Bot
# This script can be used on any platform (Render, Railway, Fly.io, etc.)

set -e  # Exit on error

echo "🚀 Starting Discord Bot Deployment..."
echo ""

# Function to check environment variable
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ ERROR: $1 environment variable is not set"
        echo "   Please configure it in your deployment platform"
        exit 1
    else
        echo "✅ $1 is set"
    fi
}

# Validate environment variables
echo "🔍 Validating environment variables..."
check_env_var "DISCORD_TOKEN"
check_env_var "GEMINI_API_KEY"
check_env_var "DATABASE_URL"
echo ""

# Set NODE_ENV to production if not set
export NODE_ENV=${NODE_ENV:-production}
echo "📌 Environment: $NODE_ENV"
echo ""

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --production=false
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed successfully"
echo ""

# Run database migrations/push
echo "🗄️  Setting up database..."
npm run db:push -- --force
if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Database setup had issues, but continuing..."
fi
echo "✅ Database setup complete"
echo ""

# Build the application
echo "🔨 Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Start the bot
echo "🤖 Starting Discord bot in production mode..."
echo ""
exec npm start
