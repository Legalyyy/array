#!/bin/bash

# HolaCentro Trading Journal - Initialization Script
# This script sets up the complete environment for the application

set -e

echo "═══════════════════════════════════════════════════════"
echo "  HolaCentro Trading Journal - Initialization Script"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Step 1: Check Node.js installation
print_step "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION found"
echo ""

# Step 2: Check environment variables
print_step "Checking environment variables..."
MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$DISCORD_BOT_TOKEN" ]; then
    MISSING_VARS+=("DISCORD_BOT_TOKEN")
fi

if [ -z "$DISCORD_CLIENT_ID" ]; then
    MISSING_VARS+=("DISCORD_CLIENT_ID")
fi

if [ -z "$DISCORD_GUILD_ID" ]; then
    MISSING_VARS+=("DISCORD_GUILD_ID")
fi

if [ -z "$SESSION_SECRET" ]; then
    print_warning "SESSION_SECRET not set, generating one..."
    export SESSION_SECRET=$(openssl rand -base64 32)
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env
    print_success "Generated SESSION_SECRET and saved to .env"
fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please set these variables in your .env file or environment"
    echo ""
    echo "Example .env file:"
    echo "DATABASE_URL=postgresql://user:password@host:port/database"
    echo "DISCORD_BOT_TOKEN=your_bot_token_here"
    echo "DISCORD_CLIENT_ID=your_client_id_here"
    echo "DISCORD_GUILD_ID=your_guild_id_here"
    echo "SESSION_SECRET=your_session_secret_here"
    echo "GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here (optional)"
    exit 1
fi

print_success "All required environment variables are set"
echo ""

# Step 3: Install dependencies
print_step "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi
echo ""

# Step 4: Generate database schema
print_step "Generating database schema..."
if npm run db:generate; then
    print_success "Database schema generated"
else
    print_warning "Schema generation failed or no changes detected"
fi
echo ""

# Step 5: Push database schema
print_step "Pushing schema to database..."
if npm run db:push; then
    print_success "Database schema pushed successfully"
else
    print_error "Failed to push database schema"
    exit 1
fi
echo ""

# Step 6: Check database connection
print_step "Checking database connection..."
if node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1\`.then(() => {
  console.log('${GREEN}✓${NC} Database connection successful');
  process.exit(0);
}).catch((err) => {
  console.error('${RED}✗${NC} Database connection failed:', err.message);
  process.exit(1);
});
"; then
    print_success "Database is ready"
else
    print_error "Database connection failed"
    exit 1
fi
echo ""

# Step 7: Build the application (if needed)
print_step "Building application..."
if npm run build 2>/dev/null; then
    print_success "Application built successfully"
else
    print_warning "Build step skipped or not configured"
fi
echo ""

# Done!
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}  Setup Complete!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Start the application with: npm run dev"
echo "  2. The Discord bot will connect automatically"
echo "  3. Access the web interface at: http://localhost:5000"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:generate  - Generate database migrations"
echo "  npm run db:push      - Push schema to database"
echo "  npm run db:studio    - Open database studio"
echo ""
