#!/bin/bash

echo "🤖 Initializing Discord Bot..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root."
    exit 1
fi

# Check required environment variables
if [ -z "$DISCORD_TOKEN" ]; then
    echo "❌ Error: DISCORD_TOKEN environment variable is not set."
    echo "   Please add your Discord bot token to the environment variables."
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ Error: GEMINI_API_KEY environment variable is not set."
    echo "   Please add your Gemini API key to the environment variables."
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set."
    echo "   Please provision a PostgreSQL database."
    exit 1
fi

echo "✅ Environment variables validated"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Initialize database
echo "🗄️  Initializing database..."
npm run db:push -- --force
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi
echo "✅ Database tables created"
echo ""

# Start the bot
echo "🚀 Starting Discord bot..."
echo ""
npm run dev
